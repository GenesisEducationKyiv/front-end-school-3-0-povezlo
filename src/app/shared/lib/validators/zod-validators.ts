import { AbstractControl, ValidatorFn } from '@angular/forms';
import { z } from 'zod';
import { Observable, map } from 'rxjs';
import { Result } from '../monads';
import { ApplicationError, TrackDomainError } from '@app/shared';
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
): Result<T, ApplicationError<TrackDomainError>> {
  const result = schema.safeParse(data);

  if (result.success) {
    return Result.Ok(result.data);
  }

  const validationError = ApplicationError.fromZodError(result.error, TrackDomainError.VALIDATION_ERROR);
  return Result.Error(validationError);
}

/**
 * Validates Observable data against a Zod schema
 * @param schema - Zod schema to validate against
 * @returns RxJS operator that validates the data
 */
export function validateObservableWithZod<T>(
  schema: z.ZodSchema<T>
) {
  return (source: Observable<unknown>): Observable<Result<T, ApplicationError<TrackDomainError>>> => {
    return source.pipe(
      map(data => validateWithZod(schema, data))
    );
  };
}
