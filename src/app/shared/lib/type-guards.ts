/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard for checking if error is an instance of Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard for checking HTTP error responses
 */
export function isHttpErrorResponse(error: unknown): error is { status: number; message: string } {
  return (
    isObject(error) &&
    'status' in error &&
    'message' in error &&
    isNumber(error['status']) &&
    isString(error['message'])
  );
}

/**
 * Type predicate to filter out null/undefined values from arrays
 */
export function notNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

