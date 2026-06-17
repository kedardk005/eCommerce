declare module 'lru-cache' {
  class LRU<K = any, V = any> {
    constructor(options?: { max?: number; maxAge?: number })
    get(key: K): V | undefined
    set(key: K, value: V, maxAge?: number): boolean
    del(key: K): void
    reset(): void
    keys(): K[]
    length: number
  }
  export default LRU
}
