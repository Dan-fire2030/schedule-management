interface CacheItem<T> {
  data: T
  timestamp: number
  expiry: number
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5分

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // パターンマッチによるキャッシュクリア
  clearPattern(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    )
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() - item.timestamp > item.expiry) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

export const cache = new SimpleCache()

export function createCacheKey(...parts: (string | number)[]): string {
  return parts.join(':')
}

export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key)
  if (cached) {
    return Promise.resolve(cached)
  }
  
  return fetcher().then(data => {
    cache.set(key, data, ttl)
    return data
  })
}