import { AbstractControl, ValidatorFn } from '@angular/forms';
import { z } from 'zod';
import { Result, ok, err } from 'neverthrow';
import { Observable, map } from 'rxjs';
import { createValidationError, DomainError } from '../result';
import { isDefined } from '@app/shared';

/**
 * Creates an Angular validator from a Zod schema
 * @param schema - Zod schema to validate against
 * @returns Angular ValidatorFn
 */
export function zodValidator(schema: z.ZodSchema): ValidatorFn {
  return (control: AbstractControl) => {
    const result = schema.safeParse(control.value);
    if (result.success) {
      return null;
    }
    const errorMessage = result.error.errors[0]?.message;
    return {
      zodError: {
        message: isDefined(errorMessage) && errorMessage !== '' ? errorMessage : 'Invalid value'
      }
    };
  };
}

/**
 * Validates data against a Zod schema and returns a Result
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Result with validated data or validation error
 */
export function validateWithZod<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, DomainError> {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  }

  const errorFields: Record<string, string[]> = {};
  result.error.errors.forEach(error => {
    const path = error.path.join('.');
    if (errorFields[path] === undefined) {
      errorFields[path] = [];
    }
    errorFields[path].push(error.message);
  });

  return err(createValidationError(
    'Validation failed',
    errorFields
  ));
}

/**
 * Validates Observable data against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns RxJS operator that validates the data
 */
export function validateObservableWithZod<T>(
  schema: z.ZodSchema<T>
) {
  return (source: Observable<unknown>): Observable<Result<T, DomainError>> => {
    return source.pipe(
      map(data => validateWithZod(schema, data))
    );
  };
}
