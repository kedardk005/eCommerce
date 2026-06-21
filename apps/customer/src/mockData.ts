export interface Review {
  id: string
  reviewerName: string
  rating: number
  comment: string
  date: string
  userId?: string
}

export interface Variant {
  name: string
  stock: number
}

export interface Product {
  id: string
  title: string
  slug: string
  description: string
  price: number
  discountPrice: number
  brand: string
  category: string
  ageGroup: string
  rating: number
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock'
  variants: Variant[]
  reviews: Review[]
  imageColor: string // CSS color class to make the visual boxes beautiful
  image?: string
  images?: { id?: string; r2Key?: string; url: string; position?: number }[]
}

export const CATEGORIES = [
  'Action Figures',
  'Educational',
  'Soft Toys',
  'Outdoor',
  'Building Blocks',
  'Wooden Vehicles'
]

export const BRANDS = [
  'Forest Minds',
  'Oak & Elm',
  'TumbleTree',
  'EcoToys',
  'LittleSprout'
]

export const AGE_GROUPS = [
  '0-1 years',
  '1-3 years',
  '3-5 years',
  '5-7 years',
  '8+ years'
]

export const MOCK_PRODUCTS: Product[] = []
