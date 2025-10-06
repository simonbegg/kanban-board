// Simple in-memory rate limiter for client-side protection
// For production, use Supabase Edge Functions with Upstash Redis

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  maxRequests: number  // Maximum requests allowed
  windowMs: number     // Time window in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
}

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (e.g., user ID + endpoint)
 * @param config - Rate limit configuration
 * @returns true if rate limit exceeded, false otherwise
 */
export function isRateLimited(
  key: string, 
  config: RateLimitConfig = DEFAULT_CONFIG
): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean up
    cleanupExpired()
  }

  if (!entry || now > entry.resetAt) {
    // Create new entry or reset existing
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return false
  }

  // Increment count
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return true
  }

  return false
}

/**
 * Get remaining requests for a key
 */
export function getRemainingRequests(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { remaining: number; resetAt: number } {
  const entry = rateLimitStore.get(key)
  const now = Date.now()

  if (!entry || now > entry.resetAt) {
    return {
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    }
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  }
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Rate limit configurations for different operations
 */
export const RATE_LIMITS = {
  // Read operations - more lenient
  READ: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
  
  // Write operations - more strict
  WRITE: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  
  // Authentication - very strict
  AUTH: { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
} as const

export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetAt: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}
