import 'server-only'

import {
  getRedisActivityCacheTtlSeconds,
  shouldUseRedisCache,
} from '@/lib/cache-runtime-toggle'
import { redisDel, redisGetJson, redisSetJson } from '@/lib/redis-client'
import type { ActivityFeedData } from '@/types/activity'

const ACTIVITY_FEED_CACHE_KEY = 'waken:activity:feed:v1'

type MemoryCacheValue = {
  expiresAt: number
  value: ActivityFeedData
}

declare global {
  var __wakenActivityFeedMemoryCache: MemoryCacheValue | null | undefined
}

function getMemoryCache(): MemoryCacheValue | null {
  return globalThis.__wakenActivityFeedMemoryCache ?? null
}

function getMemoryCached(): ActivityFeedData | null {
  const memoryCache = getMemoryCache()
  if (!memoryCache) return null
  if (Date.now() > memoryCache.expiresAt) {
    globalThis.__wakenActivityFeedMemoryCache = null
    return null
  }
  return memoryCache.value
}

function setMemoryCached(value: ActivityFeedData, ttlSeconds: number): void {
  const ttlMs = Math.max(1000, Math.round(ttlSeconds * 1000))
  globalThis.__wakenActivityFeedMemoryCache = {
    expiresAt: Date.now() + ttlMs,
    value,
  }
}

export async function getCachedActivityFeedData(): Promise<ActivityFeedData | null> {
  const memoryHit = getMemoryCached()
  if (memoryHit) {
    return memoryHit
  }

  const useRedis = await shouldUseRedisCache()
  if (!useRedis) {
    return null
  }

  const redisHit = await redisGetJson<ActivityFeedData>(ACTIVITY_FEED_CACHE_KEY)
  if (redisHit) {
    const ttlSeconds = await getRedisActivityCacheTtlSeconds()
    setMemoryCached(redisHit, Math.min(ttlSeconds, 3))
  }
  return redisHit
}

export async function setCachedActivityFeedData(value: ActivityFeedData): Promise<void> {
  const ttlSeconds = await getRedisActivityCacheTtlSeconds()
  setMemoryCached(value, Math.min(ttlSeconds, 3))

  const useRedis = await shouldUseRedisCache()
  if (useRedis) {
    await redisSetJson(ACTIVITY_FEED_CACHE_KEY, value, ttlSeconds)
  }
}

export async function clearCachedActivityFeedData(): Promise<void> {
  globalThis.__wakenActivityFeedMemoryCache = null
  const useRedis = await shouldUseRedisCache()
  if (useRedis) {
    await redisDel(ACTIVITY_FEED_CACHE_KEY)
  }
}
