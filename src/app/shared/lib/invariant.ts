/**
 * Invariant function for runtime assertions
 * Throws an error if the condition is false
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (condition === false || condition === null || condition === undefined || condition === 0 || condition === '') {
    throw new Error(`Invariant violation: ${message}`);
  }
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(value: T | null | undefined, message: string): asserts value is T {
  invariant(value !== null && value !== undefined, message);
}

/**
 * Assert that a value is a string
 */
export function assertString(value: unknown, message: string): asserts value is string {
  invariant(typeof value === 'string', message);
}

/**
 * Assert that a value is a number
 */
export function assertNumber(value: unknown, message: string): asserts value is number {
  invariant(typeof value === 'number' && !isNaN(value), message);
}

/**
 * Assert that a value is an array
 */
export function assertArray<T>(value: unknown, message: string): asserts value is T[] {
  invariant(Array.isArray(value), message);
}

/**
 * Assert that a value is never (exhaustive check)
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}
