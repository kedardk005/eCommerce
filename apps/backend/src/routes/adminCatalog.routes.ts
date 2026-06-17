import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware'
import { logAction } from '../middleware/activityLog.middleware'
import { CacheService } from '../services/cache.service'

const router = Router()

// Zod validation schemas
const createProductSchema = z.object({
  title: z.string().min(2, 'Title is too short'),
  slug: z.string().min(2, 'Slug is too short'),
  description: z.string().min(10, 'Description is too short'),
  brandId: z.string().min(1, 'Brand is required'),
  categoryId: z.string().min(1, 'Category is required'),
  ageGroup: z.string().min(1, 'Age group is required'),
  basePrice: z.number().int().positive('Base price must be a positive integer'),
  discountPrice: z.number().int().positive('Discount price must be positive').nullable().optional(),
  status: z.enum(['active', 'draft', 'archived']).default('draft'),
  variants: z.array(z.object({
    sku: z.string().min(3, 'SKU is too short'),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    priceOverride: z.number().int().positive('Price override must be positive').nullable().optional(),
    attributes: z.record(z.string(), z.any())
  })).min(1, 'At least one variant is required'),
  images: z.array(z.object({
    r2Key: z.string().min(1, 'r2Key is required'),
    url: z.string().url('Invalid image URL'),
    position: z.number().int().nonnegative().default(0)
  })).optional()
})

const updateProductSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  ageGroup: z.string().optional(),
  basePrice: z.number().int().positive().optional(),
  discountPrice: z.number().int().positive().nullable().optional(),
  status: z.enum(['active', 'draft', 'archived']).optional(),
  variants: z.array(z.object({
    id: z.string().optional(),
    sku: z.string().min(3),
    stock: z.number().int().nonnegative(),
    priceOverride: z.number().int().positive().nullable().optional(),
    attributes: z.record(z.string(), z.any())
  })).optional(),
  images: z.array(z.object({
    r2Key: z.string(),
    url: z.string().url(),
    position: z.number().int().nonnegative().default(0)
  })).optional()
})

const categoryCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().default(true)
})

const categoryUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional()
})

/**
 * POST /api/admin/products
 * Create product, variants, and images. Activity logged. Cache invalidated.
 */
router.post(
  '/products',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'CREATE_PRODUCT',
    entityType: 'Product',
    entityId: resBody.id,
    metadata: { title: req.body.title, slug: req.body.slug }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = createProductSchema.parse(req.body)

      // Verify Brand & Category exist
      const brand = await prisma.brand.findUnique({ where: { id: data.brandId } })
      if (!brand) return res.status(400).json({ error: 'Brand not found' })

      const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
      if (!category) return res.status(400).json({ error: 'Category not found' })

      // Check for slug uniqueness
      const existing = await prisma.product.findUnique({ where: { slug: data.slug } })
      if (existing) return res.status(400).json({ error: 'Slug must be unique' })

      // Create product transactionally
      const product = await prisma.$transaction(async (tx) => {
        return tx.product.create({
          data: {
            title: data.title,
            slug: data.slug,
            description: data.description,
            brandId: data.brandId,
            categoryId: data.categoryId,
            ageGroup: data.ageGroup,
            basePrice: data.basePrice,
            discountPrice: data.discountPrice ?? null,
            status: data.status,
            createdBy: req.user!.id,
            variants: {
              create: data.variants.map(v => ({
                sku: v.sku,
                stock: v.stock,
                priceOverride: v.priceOverride ?? null,
                attributes: v.attributes as any
              }))
            },
            images: {
              create: (data.images || []).map(img => ({
                r2Key: img.r2Key,
                url: img.url,
                position: img.position
              }))
            }
          },
          include: {
            variants: true,
            images: true
          }
        })
      })

      // Invalidate list caches and specific detail cache
      CacheService.invalidateProduct(product.slug)

      return res.status(201).json(product)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminCatalogRoutes] Error creating product:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * PUT /api/admin/products/:id
 * Update product, variants, and images. Atomic updates. Activity logged. Cache invalidated.
 */
router.put(
  '/products/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'UPDATE_PRODUCT',
    entityType: 'Product',
    entityId: req.params.id,
    metadata: { title: req.body.title }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const productId = req.params.id

    try {
      const data = updateProductSchema.parse(req.body)

      const existingProduct = await prisma.product.findUnique({
        where: { id: productId }
      })
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found.' })
      }

      // Check slug uniqueness if it changed
      if (data.slug && data.slug !== existingProduct.slug) {
        const slugConflict = await prisma.product.findUnique({ where: { slug: data.slug } })
        if (slugConflict) return res.status(400).json({ error: 'Slug must be unique' })
      }

      // Perform updates transactionally with atomic variant stock updates
      const updatedProduct = await prisma.$transaction(async (tx) => {
        // 1. Update product base fields
        const updated = await tx.product.update({
          where: { id: productId },
          data: {
            title: data.title,
            slug: data.slug,
            description: data.description,
            brandId: data.brandId,
            categoryId: data.categoryId,
            ageGroup: data.ageGroup,
            basePrice: data.basePrice,
            discountPrice: data.discountPrice,
            status: data.status
          },
          include: {
            variants: true,
            images: true
          }
        })

        // 2. Sync variants
        if (data.variants) {
          const existingVariants = await tx.productVariant.findMany({
            where: { productId }
          })
          const existingIds = existingVariants.map(v => v.id)
          const incomingIds = data.variants.map(v => v.id).filter(Boolean) as string[]

          // Soft/hard delete variants not present in incoming list
          const toDelete = existingIds.filter(id => !incomingIds.includes(id))
          if (toDelete.length > 0) {
            await tx.productVariant.deleteMany({
              where: { id: { in: toDelete } }
            })
          }

          // Create or update variants
          for (const variant of data.variants) {
            if (variant.id) {
              // Update stock and fields atomically in a single Prisma database update call
              await tx.productVariant.update({
                where: { id: variant.id },
                data: {
                  sku: variant.sku,
                  stock: variant.stock, // Direct atomic update write
                  priceOverride: variant.priceOverride,
                  attributes: variant.attributes as any
                }
              })
            } else {
              await tx.productVariant.create({
                data: {
                  productId,
                  sku: variant.sku,
                  stock: variant.stock,
                  priceOverride: variant.priceOverride,
                  attributes: variant.attributes as any
                }
              })
            }
          }
        }

        // 3. Sync images
        if (data.images) {
          await tx.productImage.deleteMany({ where: { productId } })
          await tx.productImage.createMany({
            data: data.images.map(img => ({
              productId,
              r2Key: img.r2Key,
              url: img.url,
              position: img.position
            }))
          })
        }

        return updated
      })

      // Invalidate cache for the old slug and the new slug
      CacheService.invalidateProduct(existingProduct.slug)
      if (data.slug && data.slug !== existingProduct.slug) {
        CacheService.invalidateProduct(data.slug)
      }

      return res.json(updatedProduct)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminCatalogRoutes] Error updating product:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * DELETE /api/admin/products/:id
 * Soft delete product (set status=archived). Activity logged. Cache invalidated.
 */
router.delete(
  '/products/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'DELETE_PRODUCT',
    entityType: 'Product',
    entityId: req.params.id,
    metadata: { status: 'archived' }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const productId = req.params.id

    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      })

      if (!product) {
        return res.status(404).json({ error: 'Product not found.' })
      }

      const archivedProduct = await prisma.product.update({
        where: { id: productId },
        data: { status: 'archived' }
      })

      CacheService.invalidateProduct(product.slug)

      return res.json({
        status: 'success',
        message: 'Product archived successfully.',
        product: archivedProduct
      })
    } catch (error) {
      console.error('[AdminCatalogRoutes] Error deleting product:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * POST /api/admin/categories
 * Create category. Activity logged. Cache invalidated.
 */
router.post(
  '/categories',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'CREATE_CATEGORY',
    entityType: 'Category',
    entityId: resBody.id,
    metadata: { name: req.body.name }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = categoryCreateSchema.parse(req.body)

      // Ensure slug uniqueness
      const existing = await prisma.category.findUnique({ where: { slug: data.slug } })
      if (existing) return res.status(400).json({ error: 'Category slug must be unique' })

      const category = await prisma.category.create({
        data: {
          name: data.name,
          slug: data.slug,
          parentId: data.parentId ?? null,
          isActive: data.isActive
        }
      })

      CacheService.reset() // Flush categories list cache

      return res.status(201).json(category)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminCatalogRoutes] Error creating category:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * PUT /api/admin/categories/:id
 * Update category. Activity logged. Cache invalidated.
 */
router.put(
  '/categories/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'UPDATE_CATEGORY',
    entityType: 'Category',
    entityId: req.params.id,
    metadata: { name: req.body.name }
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const data = categoryUpdateSchema.parse(req.body)

      const existing = await prisma.category.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ error: 'Category not found.' })

      if (data.slug && data.slug !== existing.slug) {
        const slugConflict = await prisma.category.findUnique({ where: { slug: data.slug } })
        if (slugConflict) return res.status(400).json({ error: 'Category slug must be unique' })
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          parentId: data.parentId,
          isActive: data.isActive
        }
      })

      CacheService.reset()

      return res.json(updated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
      }
      console.error('[AdminCatalogRoutes] Error updating category:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * DELETE /api/admin/categories/:id
 * Delete category. Activity logged. Cache invalidated.
 */
router.delete(
  '/categories/:id',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  logAction((req, resBody) => ({
    action: 'DELETE_CATEGORY',
    entityType: 'Category',
    entityId: req.params.id
  }))(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params

    try {
      const existing = await prisma.category.findUnique({ where: { id } })
      if (!existing) return res.status(404).json({ error: 'Category not found.' })

      await prisma.category.delete({
        where: { id }
      })

      CacheService.reset()

      return res.json({
        status: 'success',
        message: 'Category deleted successfully.'
      })
    } catch (error) {
      console.error('[AdminCatalogRoutes] Error deleting category:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  })
)

/**
 * GET /api/admin/products
 * List all products for administration, cursor-paginated
 */
router.get(
  '/products',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 200)
      const cursor = req.query.cursor as string | undefined

      const products = await prisma.product.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        skip: cursor ? 1 : 0,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          brand: true,
          category: true,
          images: { orderBy: { position: 'asc' } },
          variants: true
        }
      })

      const hasMore = products.length > limit
      if (hasMore) {
        products.pop()
      }
      const nextCursor = hasMore ? products[products.length - 1].id : null

      return res.json({
        items: products,
        products, // fallback alias for raw array mapping
        nextCursor,
        hasMore
      })
    } catch (error) {
      console.error('[AdminCatalogRoutes] Error listing products:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * GET /api/admin/categories
 * List all categories for administration
 */
router.get(
  '/categories',
  requireAuth,
  requireRole('super_owner', 'sub_admin'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      })
      return res.json(categories)
    } catch (error) {
      console.error('[AdminCatalogRoutes] Error listing categories:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

/**
 * GET /api/admin/_internal/cache-stats
 * Returns cache hit/miss stats and details (requireRole super_owner only)
 */
router.get(
  '/_internal/cache-stats',
  requireAuth,
  requireRole('super_owner'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = CacheService.getStats()
      return res.json(stats)
    } catch (error) {
      console.error('[AdminCatalogRoutes] Cache stats error:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  }
)

export default router
