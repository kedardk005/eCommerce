import LRU from 'lru-cache'

const options = {
  max: 500,
  maxAge: 10 * 60 * 1000 // 10 minutes default TTL
}

const cache = new LRU<string, any>(options)

let hitCount = 0
let missCount = 0

export const CacheService = {
  /**
   * Retrieve cached item
   */
  get: (key: string): any => {
    const val = cache.get(key)
    if (val !== undefined) {
      hitCount++
    } else {
      missCount++
    }
    return val
  },

  /**
   * Save item to cache
   */
  set: (key: string, value: any, maxAge?: number): boolean => {
    return cache.set(key, value, maxAge)
  },

  /**
   * Delete specific cache key
   */
  del: (key: string): void => {
    cache.del(key)
  },

  /**
   * Clear the entire cache
   */
  reset: (): void => {
    cache.reset()
  },

  /**
   * Invalidate product details and all product list caches
   */
  invalidateProduct: (slug: string): void => {
    // Find and invalidate all cached detail and list responses for this product
    const keys = cache.keys()
    for (const key of keys) {
      if (
        key.startsWith(`product:detail:${slug}`) ||
        key.startsWith(`product:related:${slug}`) ||
        key.startsWith('product:list:')
      ) {
        cache.del(key)
      }
    }
  },

  /**
   * Retrieve hit/miss counts and current cache details
   */
  getStats: () => {
    return {
      hits: hitCount,
      misses: missCount,
      size: cache.length,
      max: options.max,
      keys: cache.keys()
    }
  }
}

