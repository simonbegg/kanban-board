// Input validation and sanitization utilities

export const VALIDATION_LIMITS = {
  TITLE_MIN: 1,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
  CATEGORY_MAX: 50,
  BOARD_TITLE_MIN: 1,
  BOARD_TITLE_MAX: 100,
  BOARD_DESCRIPTION_MAX: 500,
} as const

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Sanitize string input - removes dangerous characters and trims whitespace
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
}

/**
 * Validate task title
 */
export function validateTaskTitle(title: string): string {
  const sanitized = sanitizeString(title)
  
  if (sanitized.length < VALIDATION_LIMITS.TITLE_MIN) {
    throw new ValidationError('Title is required')
  }
  
  if (sanitized.length > VALIDATION_LIMITS.TITLE_MAX) {
    throw new ValidationError(`Title must be ${VALIDATION_LIMITS.TITLE_MAX} characters or less`)
  }
  
  return sanitized
}

/**
 * Validate task description
 */
export function validateTaskDescription(description: string | null): string {
  if (!description) return ''
  
  const sanitized = sanitizeString(description)
  
  if (sanitized.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
    throw new ValidationError(`Description must be ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters or less`)
  }
  
  return sanitized
}

/**
 * Validate category name
 */
export function validateCategory(category: string): string {
  if (!category) return ''
  
  const sanitized = sanitizeString(category)
  
  if (sanitized.length > VALIDATION_LIMITS.CATEGORY_MAX) {
    throw new ValidationError(`Category must be ${VALIDATION_LIMITS.CATEGORY_MAX} characters or less`)
  }
  
  // Category should only contain alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
    throw new ValidationError('Category can only contain letters, numbers, spaces, hyphens, and underscores')
  }
  
  return sanitized.toLowerCase()
}

/**
 * Validate board title
 */
export function validateBoardTitle(title: string): string {
  const sanitized = sanitizeString(title)
  
  if (sanitized.length < VALIDATION_LIMITS.BOARD_TITLE_MIN) {
    throw new ValidationError('Board title is required')
  }
  
  if (sanitized.length > VALIDATION_LIMITS.BOARD_TITLE_MAX) {
    throw new ValidationError(`Board title must be ${VALIDATION_LIMITS.BOARD_TITLE_MAX} characters or less`)
  }
  
  return sanitized
}

/**
 * Validate board description
 */
export function validateBoardDescription(description: string | null): string {
  if (!description) return ''
  
  const sanitized = sanitizeString(description)
  
  if (sanitized.length > VALIDATION_LIMITS.BOARD_DESCRIPTION_MAX) {
    throw new ValidationError(`Board description must be ${VALIDATION_LIMITS.BOARD_DESCRIPTION_MAX} characters or less`)
  }
  
  return sanitized
}

/**
 * Validate hex color code
 */
export function validateColorCode(color: string): string {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  
  if (!hexRegex.test(color)) {
    throw new ValidationError('Invalid color code format')
  }
  
  return color.toLowerCase()
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string {
  const sanitized = sanitizeString(email)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(sanitized)) {
    throw new ValidationError('Invalid email format')
  }
  
  return sanitized.toLowerCase()
}
