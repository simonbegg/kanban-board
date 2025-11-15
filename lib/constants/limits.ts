/**
 * Plan limits and caps
 * These values are easily editable for testing
 */

export const PLAN_LIMITS = {
  FREE: {
    BOARDS: 1,
    ACTIVE_TASKS_PER_BOARD: 100, // Easy to change for testing (e.g., set to 5)
    ARCHIVED_TASKS: 1000,
    ARCHIVE_RETENTION_DAYS: 90,
  },
  PRO: {
    BOARDS: 500, // Soft cap
    ACTIVE_TASKS_PER_BOARD: 100, // Same limit for Pro
    ARCHIVED_TASKS: 200000,
    ARCHIVE_RETENTION_DAYS: 36500, // ~100 years (indefinite)
  },
} as const;

/**
 * Helper to get limits for a plan
 */
export function getLimitsForPlan(plan: "free" | "pro") {
  return plan === "pro" ? PLAN_LIMITS.PRO : PLAN_LIMITS.FREE;
}

/**
 * Calculate percentage of limit used
 */
export function calculateLimitPercentage(
  current: number,
  limit: number
): number {
  return Math.min(100, Math.round((current / limit) * 100));
}

/**
 * Check if at or over limit
 */
export function isAtLimit(current: number, limit: number): boolean {
  return current >= limit;
}

/**
 * Check if approaching limit (80%+)
 */
export function isApproachingLimit(current: number, limit: number): boolean {
  return current >= limit * 0.8 && current < limit;
}
