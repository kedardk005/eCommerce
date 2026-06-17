import React, { useState } from 'react'
import { useAdminData } from '../context/AdminDataContext'
import type { AdminProduct, AdminVariant } from '../context/AdminDataContext'

export const Products: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory
  } = useAdminData()

  // Tab state: 'list' | 'categories'
  const [activeTab, setActiveTab] = useState<'list' | 'categories'>('list')

  // Product modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Product form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [status, setStatus] = useState<AdminProduct['status']>('Active')
  const [variants, setVariants] = useState<AdminVariant[]>([{ name: 'Standard Pack', stock: 10 }])
  const [imageColor, setImageColor] = useState('bg-primary')

  // Category inline states
  const [newCatName, setNewCatName] = useState('')
  const [editingCatName, setEditingCatName] = useState<string | null>(null)
  const [editingCatValue, setEditingCatValue] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // Compute total stock of product variants
  const getProductTotalStock = (product: AdminProduct) => {
    return product.variants.reduce((sum, v) => sum + v.stock, 0)
  }

  // Set form fields for editing or resetting
  const openAddModal = () => {
    setErrorMsg(null)
    setIsSubmitting(false)
    setEditingProductId(null)
    setTitle('')
    setDescription('')
    setCategory(categories[0] || 'Educational')
    setBrand('')
    setAgeGroup('3-5 years')
    setPrice('')
    setDiscountPrice('')
    setStatus('Active')
    setVariants([{ name: 'Standard Pack', stock: 10 }])
    setImageColor('bg-primary')
    setIsModalOpen(true)
  }

  const openEditModal = (p: AdminProduct) => {
    setErrorMsg(null)
    setIsSubmitting(false)
    setEditingProductId(p.id)
    setTitle(p.title)
    setDescription(p.description)
    setCategory(p.category)
    setBrand(p.brand)
    setAgeGroup(p.ageGroup)
    setPrice(p.price.toString())
    setDiscountPrice(p.discountPrice.toString())
    setStatus(p.status)
    setVariants(p.variants.length > 0 ? p.variants : [{ name: 'Standard Pack', stock: 10 }])
    setImageColor(p.imageColor)
    setIsModalOpen(true)
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const parsedPrice = parseFloat(price) || 0
    const parsedDiscount = parseFloat(discountPrice) || 0

    const productPayload = {
      title,
      description,
      category,
      brand: brand || 'Generic',
      ageGroup: ageGroup || '3-5 years',
      price: parsedPrice,
      discountPrice: parsedDiscount,
      status,
      variants,
      imageColor
    }

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, productPayload)
      } else {
        await addProduct(productPayload)
      }
      setIsModalOpen(false)
    } catch (err: any) {
      setErrorMsg(err.message || 'Server returned validation error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Variant row builders
  const addVariantRow = () => {
    setVariants(prev => [...prev, { name: '', stock: 0 }])
  }

  const removeVariantRow = (idx: number) => {
    setVariants(prev => prev.filter((_, i) => i !== idx))
  }

  const updateVariantRow = (idx: number, field: keyof AdminVariant, val: string) => {
    setVariants(prev =>
      prev.map((v, i) => {
        if (i === idx) {
          if (field === 'stock') {
            return { ...v, stock: parseInt(val) || 0 }
          }
          return { ...v, name: val }
        }
        return v
      })
    )
  }

  // Category operations
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryError(null)
    if (newCatName.trim()) {
      try {
        await addCategory(newCatName.trim())
        setNewCatName('')
      } catch (err: any) {
        setCategoryError(err.message || 'Failed to create category')
      }
    }
  }

  const handleSaveCategoryEdit = async (oldName: string) => {
    setCategoryError(null)
    if (editingCatValue.trim() && editingCatValue.trim() !== oldName) {
      try {
        await updateCategory(oldName, editingCatValue.trim())
        setEditingCatName(null)
      } catch (err: any) {
        setCategoryError(err.message || 'Failed to update category')
      }
    } else {
      setEditingCatName(null)
    }
  }

  const getProductCountForCat = (catName: string) => {
    return products.filter(p => p.category === catName).length
  }

  // Color options for toy thumbnail simulation
  const colorOptions = [
    { label: 'Navy', value: 'bg-secondary' },
    { label: 'Coral', value: 'bg-primary' },
    { label: 'Warm Sand', value: 'bg-bg' },
    { label: 'Teal', value: 'bg-accent-teal' },
    { label: 'Ocean Blue', value: 'bg-accent-blue' },
    { label: 'Sunny Yellow', value: 'bg-accent-yellow' },
  ]

  return (
    <div className="space-y-4">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 text-left">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">Catalog Manager</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Configure toy catalog parameters, update status levels, and manage category listings.
          </p>
        </div>
        
        {/* Navigation Tabs & Add Button */}
        <div className="flex items-center space-x-2 mt-3 sm:mt-0">
          <div className="bg-bg border border-border rounded p-0.5 flex">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                activeTab === 'list' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Toys List
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${
                activeTab === 'categories' ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              Categories
            </button>
          </div>
          
          {activeTab === 'list' && (
            <button
              onClick={openAddModal}
              className="bg-primary hover:bg-primary-hover text-white font-heading font-bold text-[11px] px-3.5 py-1.5 rounded transition-colors shadow-sm"
            >
              ➕ Add Product
            </button>
          )}
        </div>
      </div>

      {/* --- TAB 1: PRODUCT LIST VIEW --- */}
      {activeTab === 'list' && (
        <div className="bg-surface border border-border rounded shadow-sm overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                  <th className="px-4 py-2.5">Toy Item</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5 text-right">Price</th>
                  <th className="px-4 py-2.5 text-right font-mono">Stock</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {products.length > 0 ? (
                  products.map((p) => {
                    const totalStock = getProductTotalStock(p)
                    return (
                      <tr key={p.id} className="hover:bg-bg transition-colors">
                        <td className="px-4 py-2.5 flex items-center space-x-2">
                          <div className={`h-8 w-8 rounded ${p.imageColor} border border-border/50 flex items-center justify-center text-white text-xs font-bold font-heading select-none shadow-sm`}>
                            🧸
                          </div>
                          <div>
                            <div className="font-semibold text-ink">{p.title}</div>
                            <div className="text-[10px] text-ink-muted">Brand: {p.brand} | Age: {p.ageGroup}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-ink-muted">{p.category}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="font-semibold text-ink">${p.discountPrice.toFixed(2)}</div>
                          {p.price > p.discountPrice && (
                            <div className="text-[10px] text-ink-muted line-through">${p.price.toFixed(2)}</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          <div className="font-bold">{totalStock} units</div>
                          <div className="text-[9px] text-ink-muted">{p.variants.length} variant(s)</div>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`inline-block text-[9px] font-heading font-extrabold px-2 py-0.5 rounded-full border ${
                            p.status === 'Active'
                              ? 'bg-accent-teal/10 text-accent-teal border-accent-teal/20'
                              : p.status === 'Draft'
                              ? 'bg-accent-yellow/10 text-ink border-accent-yellow/20'
                              : 'bg-bg text-ink-muted border-border'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => openEditModal(p)}
                              className="text-[10px] font-bold text-ink-muted hover:underline focus:outline-none"
                            >
                              Edit
                            </button>
                            <span className="text-border">|</span>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${p.title}"?`)) {
                                  deleteProduct(p.id)
                                }
                              }}
                              className="text-[10px] font-bold text-primary hover:underline focus:outline-none"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ink-muted italic">
                      No toy products found. Click "Add Product" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: CATEGORIES VIEW --- */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {categoryError && (
            <div className="bg-primary/10 border border-primary/25 p-3 rounded text-primary text-xs font-semibold">
              ⚠️ {categoryError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {/* Add Category Form */}
          <div className="bg-surface border border-border p-4 rounded shadow-sm h-fit">
            <h3 className="text-xs font-heading font-bold text-ink mb-3">Add New Category</h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Brain Teasers"
                  className="w-full mt-1 px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white font-heading font-bold text-xs py-1.5 px-3 rounded transition-colors shadow-sm"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Categories List Table */}
          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden md:col-span-2">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-xs font-heading font-bold text-ink">Category Directory</h3>
            </div>
            
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                  <th className="px-4 py-2 text-left">Category Name</th>
                  <th className="px-4 py-2 text-center">Toys Linked</th>
                  <th className="px-4 py-2 text-center">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {categories.map((cat) => {
                  const toyCount = getProductCountForCat(cat)
                  const isEditing = editingCatName === cat

                  return (
                    <tr key={cat} className="hover:bg-bg/40 transition-colors">
                      <td className="px-4 py-2.5 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingCatValue}
                            onChange={(e) => setEditingCatValue(e.target.value)}
                            className="px-2 py-1 bg-surface border border-primary rounded text-xs focus:outline-none w-full max-w-xs"
                            autoFocus
                          />
                        ) : (
                          <span className="text-ink">{cat}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono font-bold text-ink-muted">
                        {toyCount} items
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveCategoryEdit(cat)}
                                className="text-[10px] font-bold text-accent-teal hover:underline focus:outline-none"
                              >
                                Save
                              </button>
                              <span className="text-border">|</span>
                              <button
                                onClick={() => setEditingCatName(null)}
                                className="text-[10px] font-bold text-ink-muted hover:underline focus:outline-none"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCatName(cat)
                                  setEditingCatValue(cat)
                                }}
                                className="text-[10px] font-bold text-ink-muted hover:underline focus:outline-none"
                              >
                                Rename
                              </button>
                              <span className="text-border">|</span>
                              <button
                                onClick={async () => {
                                  setCategoryError(null)
                                  if (confirm(`Are you sure you want to delete category "${cat}"? Products under it will be marked "Uncategorized".`)) {
                                    try {
                                      await deleteCategory(cat)
                                    } catch (err: any) {
                                      setCategoryError(err.message || 'Failed to delete category')
                                    }
                                  }
                                }}
                                className="text-[10px] font-bold text-primary hover:underline focus:outline-none"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT PRODUCT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          
          {/* Card Body */}
          <div className="bg-surface border border-border w-full max-w-xl rounded-lg shadow-xl overflow-hidden z-10 text-left animate-fade-in-up">
            <div className="bg-secondary py-4 px-5 text-white flex justify-between items-center">
              <h3 className="font-heading font-extrabold text-sm tracking-wide">
                {editingProductId ? '🔧 Edit Catalog Toy' : '🧸 Add Product to Catalog'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:opacity-85 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-5 space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Product Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Classic Wood Stacker"
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-ink-muted uppercase">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Crafted from natural birchwood. Water-based varnish."
                  className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Brand */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Oak & Elm"
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Age Group */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Age Group</label>
                  <select
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="0-1 years">0-1 years</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3-5 years">3-5 years</option>
                    <option value="5-7 years">5-7 years</option>
                    <option value="8+ years">8+ years</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Catalog Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AdminProduct['status'])}
                    className="w-full px-2 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Active">Active (Publish)</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Price */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="39.99"
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                {/* Discount Price */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Discount Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="34.99"
                    className="w-full px-2.5 py-1.5 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Toy Visual Color Selector & Image Upload Stub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-bg border border-border p-3 rounded">
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Thumbnail Accent Color</label>
                  <select
                    value={imageColor}
                    onChange={(e) => setImageColor(e.target.value)}
                    className="w-full px-2 py-1 bg-surface border border-border rounded text-xs focus:outline-none"
                  >
                    {colorOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Image upload stub UI */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-ink-muted uppercase">Toy Images Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={() => alert('Image uploading is simulated. Custom accent thumbnail color will be applied instead.')}
                    className="text-[10px] text-ink-muted cursor-pointer mt-1"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="bg-bg border border-border p-3 rounded space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-semibold text-ink uppercase tracking-wider">Product Variants Setup</h4>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-[10px] font-bold text-ink-muted hover:underline focus:outline-none"
                  >
                    ➕ Add Variant
                  </button>
                </div>
                
                <div className="space-y-1.5">
                  {variants.map((variant, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-surface p-1.5 rounded border border-border">
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariantRow(idx, 'name', e.target.value)}
                        placeholder="e.g. Natural Wood, Red"
                        className="flex-1 min-w-0 px-2 py-1 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary"
                        required
                      />
                      <div className="flex items-center space-x-1 w-24">
                        <span className="text-[9px] text-ink-muted uppercase font-semibold">Qty:</span>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => updateVariantRow(idx, 'stock', e.target.value)}
                          placeholder="10"
                          className="w-full px-2 py-1 bg-bg border border-border rounded text-xs focus:outline-none focus:border-primary font-mono"
                          required
                        />
                      </div>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(idx)}
                          className="text-primary hover:opacity-80 px-1 font-bold text-xs"
                          title="Remove variant"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message Feedback */}
              {errorMsg && (
                <div className="bg-primary/10 border border-primary/20 p-2.5 rounded text-primary text-xs font-semibold">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end space-x-2.5 border-t border-border pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 border border-border bg-bg hover:bg-bg text-ink-muted rounded font-heading font-semibold text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded font-heading font-semibold text-xs shadow-sm disabled:opacity-55 flex items-center space-x-1"
                >
                  {isSubmitting && <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />}
                  <span>{editingProductId ? (isSubmitting ? 'Saving...' : 'Save Catalog Updates') : (isSubmitting ? 'Adding...' : 'Add to Catalog')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Products
