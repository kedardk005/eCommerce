import React, { useState } from 'react'
import { useAdminData } from '../context/AdminDataContext'

interface FlatVariantItem {
  productId: string
  productTitle: string
  variantName: string
  stock: number
  threshold: number
  imageColor: string
}

export const Inventory: React.FC = () => {
  const { updateStock, settings } = useAdminData()

  // State to filter low-stock items only
  const [filterLowStock, setFilterLowStock] = useState(false)

  // State to track which variant stock cell is being edited inline
  const [editingCell, setEditingCell] = useState<{ productId: string; variantName: string } | null>(null)
  const [editingValue, setEditingValue] = useState<number>(0)

  // Direct fetch states
  const [productsList, setProductsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const loadInventory = async () => {
    setLoading(true)
    setError(null)
    const token = localStorage.getItem('admin_accessToken')
    if (!token) {
      setError('Admin access token missing. Please sign in.')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/admin/products?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) {
        throw new Error('Failed to load products list from workshop.')
      }
      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.items || data.products || [])
      
      const formatted = items.map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.basePrice / 100,
        discountPrice: p.discountPrice ? p.discountPrice / 100 : p.basePrice / 100,
        brand: p.brand?.name || 'Generic',
        category: p.category?.name || 'Uncategorized',
        ageGroup: p.ageGroup,
        variants: p.variants ? p.variants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          name: v.attributes?.name || v.name || 'Standard',
          stock: v.stock
        })) : [],
        status: p.status === 'active' ? 'Active' : (p.status === 'draft' ? 'Draft' : 'Archived'),
        imageColor: 'bg-primary'
      }))
      setProductsList(formatted)
    } catch (err: any) {
      setError(err.message || 'Error connecting to database.')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadInventory()
  }, [])

  // Flatten products and variants for table listing
  const inventoryItems: FlatVariantItem[] = React.useMemo(() => {
    const list: FlatVariantItem[] = []
    productsList.forEach(p => {
      p.variants.forEach((v: any) => {
        list.push({
          productId: p.id,
          productTitle: p.title,
          variantName: v.name,
          stock: v.stock,
          threshold: settings?.lowStockThreshold ?? 10,
          imageColor: p.imageColor
        })
      })
    })
    return list
  }, [productsList, settings])

  // Filter items
  const filteredItems = React.useMemo(() => {
    if (filterLowStock) {
      return inventoryItems.filter(item => item.stock < item.threshold)
    }
    return inventoryItems
  }, [inventoryItems, filterLowStock])

  const startEditing = (item: FlatVariantItem) => {
    setEditError(null)
    setEditingCell({ productId: item.productId, variantName: item.variantName })
    setEditingValue(item.stock)
  }

  const saveStockEdit = async (productId: string, variantName: string) => {
    if (editingValue < 0) {
      setEditError('Stock cannot be negative.')
      return
    }
    setSaveLoading(true)
    setEditError(null)
    try {
      await updateStock(productId, variantName, editingValue)
      await loadInventory()
      setEditingCell(null)
    } catch (err: any) {
      setEditError(err.message || 'Failed to update stock.')
    } finally {
      setSaveLoading(false)
    }
  }

  // Get stock status badge text and styling
  const getStockBadge = (stock: number, threshold: number) => {
    if (stock === 0) {
      return {
        text: 'Out of Stock',
        style: 'bg-primary text-white'
      }
    }
    if (stock < threshold) {
      return {
        text: 'Low Stock',
        style: 'bg-accent-yellow/20 text-ink border border-accent-yellow/30'
      }
    }
    return {
      text: 'In Stock',
      style: 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30'
    }
  }

  if (loading && productsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-surface border border-border rounded-lg shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-xs text-ink-muted italic">Loading inventory status...</p>
      </div>
    )
  }

  if (error && productsList.length === 0) {
    return (
      <div className="p-8 text-center space-y-4 bg-surface border border-border rounded-lg shadow-sm">
        <p className="text-sm text-primary font-semibold">⚠️ {error}</p>
        <button
          onClick={loadInventory}
          className="btn-primary bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary-hover font-heading uppercase font-bold tracking-wider"
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {editError && (
        <div className="bg-primary/10 border border-primary/25 p-3 rounded-lg text-primary text-xs font-semibold text-left">
          ⚠️ {editError}
        </div>
      )}
      
      {/* Title Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3 text-left">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-ink">Inventory Controller</h2>
          <p className="text-[11px] text-ink-muted leading-normal">
            Monitor variant counts, configure warning limits, and update stock numbers inline.
          </p>
        </div>

        {/* Filter checkbox */}
        <div className="mt-3 sm:mt-0 flex items-center bg-surface border border-border px-3 py-1.5 rounded shadow-sm text-xs font-semibold text-ink select-none cursor-pointer">
          <input
            type="checkbox"
            id="lowStockFilter"
            checked={filterLowStock}
            onChange={(e) => setFilterLowStock(e.target.checked)}
            className="mr-2 cursor-pointer h-3.5 w-3.5 accent-primary rounded"
          />
          <label htmlFor="lowStockFilter" className="cursor-pointer">
            Show alerts only (&lt; 5 units)
          </label>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-surface border border-border rounded shadow-sm overflow-hidden text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-[10px] text-ink-muted uppercase font-semibold">
                <th className="px-4 py-2.5">Toy product name</th>
                <th className="px-4 py-2.5">Variant Spec</th>
                <th className="px-4 py-2.5 text-center font-mono w-44">Stock Count</th>
                <th className="px-4 py-2.5 text-center font-mono">Alert Limit</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => {
                  const badge = getStockBadge(item.stock, item.threshold)
                  const isCellEditing =
                    editingCell?.productId === item.productId &&
                    editingCell?.variantName === item.variantName

                  return (
                    <tr key={idx} className="hover:bg-bg transition-colors">
                      {/* Product Name */}
                      <td className="px-4 py-3 flex items-center space-x-2">
                        <div className={`h-8 w-8 rounded ${item.imageColor} border border-border/50 flex items-center justify-center text-white text-xs font-bold font-heading select-none shadow-sm`}>
                          📦
                        </div>
                        <div>
                          <div className="font-semibold text-ink">{item.productTitle}</div>
                          <div className="text-[10px] text-ink-muted font-mono">ID: {item.productId}</div>
                        </div>
                      </td>

                      {/* Variant Name */}
                      <td className="px-4 py-3 font-medium text-ink">
                        {item.variantName || <span className="text-ink-muted italic">Standard</span>}
                      </td>

                      {/* Stock Count (Inline Edit) */}
                      <td className="px-4 py-3 text-center">
                        {isCellEditing ? (
                          <div className="flex items-center justify-center space-x-1">
                            <input
                              type="number"
                              value={editingValue}
                              disabled={saveLoading}
                              onChange={(e) => setEditingValue(parseInt(e.target.value) || 0)}
                              className="w-16 px-1.5 py-0.5 bg-surface border border-primary rounded text-center text-xs font-mono focus:outline-none disabled:opacity-50"
                              min="0"
                              autoFocus
                            />
                            <button
                              onClick={() => saveStockEdit(item.productId, item.variantName)}
                              disabled={saveLoading}
                              className="bg-accent-teal hover:opacity-85 text-white font-bold px-2 py-0.5 rounded text-[10px] disabled:opacity-50"
                              title="Save count"
                            >
                              {saveLoading ? '...' : '✓'}
                            </button>
                            <button
                              onClick={() => setEditingCell(null)}
                              disabled={saveLoading}
                              className="bg-ink-muted hover:opacity-85 text-white font-bold px-2 py-0.5 rounded text-[10px] disabled:opacity-50"
                              title="Cancel"
                            >
                              &times;
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => startEditing(item)}
                            className="inline-block px-3 py-1 font-mono font-bold text-ink hover:bg-bg/20 border border-transparent hover:border-border rounded cursor-pointer transition-colors"
                            title="Click to edit stock level"
                          >
                            {item.stock} units
                            <span className="ml-1.5 text-[9px] text-ink-muted font-normal opacity-50">✏️</span>
                          </div>
                        )}
                      </td>

                      {/* Threshold Alert limit */}
                      <td className="px-4 py-3 text-center font-mono text-ink-muted">
                        {item.threshold} units
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block text-[9px] font-heading font-extrabold px-2.5 py-0.5 rounded border ${badge.style}`}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-muted italic">
                    No items match the current stock filter settings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-ink-muted text-left italic">
        * Tip: Click directly on any variant stock count to edit units inline. Updates populate immediately on the Dashboard KPI tiles.
      </p>
    </div>
  )
}

export default Inventory
