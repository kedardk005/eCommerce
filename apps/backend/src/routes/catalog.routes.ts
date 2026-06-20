import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware'
import { CacheService } from '../services/cache.service'

const router = Router()

// Zod schemas for review input validation
const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  text: z.string().min(3, 'Review text must be at least 3 characters long')
})

const reviewUpdateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  text: z.string().min(3).optional()
})

/**
 * GET /api/categories
 * List all active categories
 */
router.get('/categories', async (req, res) => {
  const cacheKey = 'product:categories:list'
  const cached = CacheService.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    CacheService.set(cacheKey, categories)
    return res.json(categories)
  } catch (error) {
    console.error('[CatalogRoutes] Error fetching categories:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/brands
 * List all brands
 */
router.get('/brands', async (req, res) => {
  const cacheKey = 'product:brands:list'
  const cached = CacheService.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    })
    CacheService.set(cacheKey, brands)
    return res.json(brands)
  } catch (error) {
    console.error('[CatalogRoutes] Error fetching brands:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/products
 * Cursor-paginated active products catalog with extensive filtering and sorting
 */
router.get('/products', async (req, res) => {
  // Build cache key from query params to ensure deterministic matches
  const sortedQueryParams = Object.keys(req.query)
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join('&')
  const cacheKey = `product:list:${sortedQueryParams || 'default'}`

  const cached = CacheService.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    const {
      search,
      category,
      brand,
      ageGroup,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sort,
      cursor
    } = req.query

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)

    // Build Prisma query filters
    const where: any = { status: 'active' }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (category) {
      const catStr = category as string
      where.category = {
        OR: [
          { id: catStr },
          { slug: catStr },
          { slug: catStr.toLowerCase() },
          { slug: catStr.toLowerCase().replace(/\s+/g, '-') },
          { name: catStr },
          { name: { equals: catStr, mode: 'insensitive' } }
        ]
      }
    }

    if (brand) {
      const brandStr = brand as string
      where.brand = {
        OR: [
          { id: brandStr },
          { slug: brandStr },
          { slug: brandStr.toLowerCase() },
          { slug: brandStr.toLowerCase().replace(/\s+/g, '-') },
          { name: brandStr },
          { name: { equals: brandStr, mode: 'insensitive' } }
        ]
      }
    }

    if (ageGroup) {
      where.ageGroup = ageGroup as string
    }

    // Handle min/max price checking effective price (discountPrice if set, otherwise basePrice)
    const priceConditions: any[] = []
    if (minPrice !== undefined) {
      const minVal = Math.round(parseFloat(minPrice as string) * 100)
      priceConditions.push({
        OR: [
          { AND: [{ discountPrice: null }, { basePrice: { gte: minVal } }] },
          { AND: [{ discountPrice: { not: null } }, { discountPrice: { gte: minVal } }] }
        ]
      })
    }

    if (maxPrice !== undefined) {
      const maxVal = Math.round(parseFloat(maxPrice as string) * 100)
      priceConditions.push({
        OR: [
          { AND: [{ discountPrice: null }, { basePrice: { lte: maxVal } }] },
          { AND: [{ discountPrice: { not: null } }, { discountPrice: { lte: maxVal } }] }
        ]
      })
    }

    if (priceConditions.length > 0) {
      where.AND = priceConditions
    }

    if (minRating !== undefined) {
      where.rating = { gte: parseFloat(minRating as string) }
    }

    if (inStock === 'true') {
      where.variants = {
        some: { stock: { gt: 0 } }
      }
    }

    // Determine sorting and cursor parameters
    let orderBy: any = [{ createdAt: 'desc' }, { id: 'asc' }]
    if (sort === 'price_asc') {
      orderBy = [{ basePrice: 'asc' }, { id: 'asc' }]
    } else if (sort === 'price_desc') {
      orderBy = [{ basePrice: 'desc' }, { id: 'asc' }]
    } else if (sort === 'rating') {
      orderBy = [{ rating: 'desc' }, { id: 'asc' }]
    } else if (sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }, { id: 'asc' }]
    }

    // Execute findMany query with cursor pagination
    const products = await prisma.product.findMany({
      where,
      take: limit + 1, // Fetch extra item to check for next page presence
      cursor: cursor ? { id: cursor as string } : undefined,
      skip: cursor ? 1 : 0, // Skip cursor record itself
      orderBy,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: true
      }
    })

    const hasMore = products.length > limit
    if (hasMore) {
      products.pop() // Remove extra item
    }

    const nextCursor = hasMore ? products[products.length - 1].id : null

    const responseData = {
      items: products,
      data: products,
      nextCursor,
      hasMore
    }

    CacheService.set(cacheKey, responseData)
    return res.json(responseData)
  } catch (error) {
    console.error('[CatalogRoutes] Error querying products:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/products/:slug
 * Retrieve full product details + paginated reviews list
 */
router.get('/products/:slug', async (req, res) => {
  const { slug } = req.params
  const reviewPage = parseInt(req.query.reviewPage as string) || 1
  const reviewLimit = Math.min(parseInt(req.query.reviewLimit as string) || 10, 50)
  const reviewOffset = (reviewPage - 1) * reviewLimit

  // Detail cache key includes slug and pagination queries
  const cacheKey = `product:detail:${slug}:rp=${reviewPage}&rl=${reviewLimit}`
  const cached = CacheService.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: true
      }
    })

    if (!product || product.status === 'archived') {
      return res.status(404).json({ error: 'Product not found.' })
    }

    // Fetch review pagination
    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: 'desc' },
      take: reviewLimit,
      skip: reviewOffset,
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const totalReviews = await prisma.review.count({
      where: { productId: product.id }
    })

    const responseData = {
      product,
      reviews: {
        data: reviews,
        page: reviewPage,
        limit: reviewLimit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / reviewLimit)
      }
    }

    CacheService.set(cacheKey, responseData)
    return res.json(responseData)
  } catch (error) {
    console.error('[CatalogRoutes] Error fetching product details:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * GET /api/products/:slug/related
 * Get related active products under the same category
 */
router.get('/products/:slug/related', async (req, res) => {
  const { slug } = req.params
  const limit = Math.min(parseInt(req.query.limit as string) || 4, 8)

  const cacheKey = `product:related:${slug}:limit=${limit}`
  const cached = CacheService.get(cacheKey)
  if (cached) {
    return res.json(cached)
  }

  try {
    const product = await prisma.product.findUnique({
      where: { slug }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'active'
      },
      take: limit,
      include: {
        brand: true,
        category: true,
        images: { orderBy: { position: 'asc' } },
        variants: true
      }
    })

    CacheService.set(cacheKey, related)
    return res.json(related)
  } catch (error) {
    console.error('[CatalogRoutes] Error fetching related products:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /api/products/:id/reviews
 * Submit a review. Only 1 review per product per user is allowed.
 */
router.post('/products/:id/reviews', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const productId = req.params.id
  const userId = req.user!.id

  try {
    const data = reviewInputSchema.parse(req.body)

    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' })
    }

    // Execute atomic transaction for review write and average aggregation update
    await prisma.$transaction(async (tx) => {
      // 1. Create the review
      await tx.review.create({
        data: {
          productId,
          userId,
          rating: data.rating,
          text: data.text
        }
      })

      // 2. Aggregate statistics
      const aggregates = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { id: true }
      })

      // 3. Write back to product cache model
      await tx.product.update({
        where: { id: productId },
        data: {
          rating: aggregates._avg.rating || 0.0,
          reviewCount: aggregates._count.id || 0
        }
      })
    })

    // Invalidate product details and product lists cache
    CacheService.invalidateProduct(product.slug)

    return res.status(201).json({
      status: 'success',
      message: 'Review posted successfully.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    // Check for Prisma unique constraint violation code
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ error: 'You have already submitted a review for this product.' })
    }
    console.error('[CatalogRoutes] Error submitting review:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * PATCH /api/reviews/:id
 * Edit review text or rating (author only)
 */
router.patch('/reviews/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const reviewId = req.params.id
  const userId = req.user!.id

  try {
    const data = reviewUpdateSchema.parse(req.body)

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: true }
    })

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' })
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own reviews.' })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update review
      await tx.review.update({
        where: { id: reviewId },
        data: {
          rating: data.rating,
          text: data.text
        }
      })

      // 2. Re-aggregate statistics
      const aggregates = await tx.review.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
        _count: { id: true }
      })

      // 3. Write back statistics to Product
      await tx.product.update({
        where: { id: review.productId },
        data: {
          rating: aggregates._avg.rating || 0.0,
          reviewCount: aggregates._count.id || 0
        }
      })
    })

    CacheService.invalidateProduct(review.product.slug)

    return res.json({
      status: 'success',
      message: 'Review updated successfully.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0]?.message || 'Validation error' })
    }
    console.error('[CatalogRoutes] Error updating review:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * DELETE /api/reviews/:id
 * Delete review (author only)
 */
router.delete('/reviews/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const reviewId = req.params.id
  const userId = req.user!.id

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: true }
    })

    if (!review) {
      return res.status(404).json({ error: 'Review not found.' })
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own reviews.' })
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete review
      await tx.review.delete({
        where: { id: reviewId }
      })

      // 2. Recompute statistics
      const aggregates = await tx.review.aggregate({
        where: { productId: review.productId },
        _avg: { rating: true },
        _count: { id: true }
      })

      // 3. Write back statistics
      await tx.product.update({
        where: { id: review.productId },
        data: {
          rating: aggregates._avg.rating || 0.0,
          reviewCount: aggregates._count.id || 0
        }
      })
    })

    CacheService.invalidateProduct(review.product.slug)

    return res.json({
      status: 'success',
      message: 'Review deleted successfully.'
    })
  } catch (error) {
    console.error('[CatalogRoutes] Error deleting review:', error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
})

export default router
