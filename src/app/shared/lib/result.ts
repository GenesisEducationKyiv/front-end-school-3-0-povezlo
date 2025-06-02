import { Result, ok, err, ResultAsync, fromPromise, fromThrowable } from 'neverthrow';
import { Observable, of, catchError, map } from 'rxjs';
import { isError, isHttpErrorResponse } from '@app/shared';

// Common error types
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ValidationError extends AppError {
  code: 'VALIDATION_ERROR';
  fields?: Record<string, string[]>;
}

export interface NetworkError extends AppError {
  code: 'NETWORK_ERROR';
  status?: number;
}

export interface UnknownError extends AppError {
  code: 'UNKNOWN_ERROR';
}

export type DomainError = ValidationError | NetworkError | UnknownError;

// Error constructors
export const createValidationError = (message: string, fields?: Record<string, string[]>): ValidationError => {
  const error: ValidationError = {
    code: 'VALIDATION_ERROR',
    message,
  };
  if (fields !== undefined) {
    error.fields = fields;
  }
  return error;
};

export const createNetworkError = (message: string, status?: number): NetworkError => {
  const error: NetworkError = {
    code: 'NETWORK_ERROR',
    message,
  };
  if (status !== undefined) {
    error.status = status;
  }
  return error;
};

export const createUnknownError = (message: string, details?: unknown): UnknownError => ({
  code: 'UNKNOWN_ERROR',
  message,
  details,
});

// Error conversion utilities
export function toAppError(error: unknown): DomainError {
  if (isError(error)) {
    return createUnknownError(error.message, error);
  }

  if (isHttpErrorResponse(error)) {
    return createNetworkError(error.message, error.status);
  }

  return createUnknownError('An unknown error occurred', error);
}

// Observable to Result conversion
export function observableToResult<T, E extends DomainError>(
  observable: Observable<T>
): Observable<Result<T, E>> {
  return observable.pipe(
    map((value) => ok(value) as Result<T, E>),
    catchError((error) => of(err(toAppError(error) as E)))
  );
}

// Result to Observable conversion
export function resultToObservable<T, E>(result: Result<T, E>): Observable<T> {
  return result.match(
    (value) => of(value),
    (error) => {
      throw new Error(JSON.stringify(error));
    }
  );
}

// Safe function execution
export function safeExecute<T, A extends unknown[]>(
  fn: (...args: A) => T
): (...args: A) => Result<T, UnknownError> {
  return fromThrowable(fn, (error) => createUnknownError(String(error)));
}

// Safe async function execution
export function safeExecuteAsync<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>
): (...args: A) => ResultAsync<T, DomainError> {
  return (...args: A) => {
    return fromPromise(fn(...args), toAppError);
  };
}
