import { AbstractControl, ValidatorFn } from '@angular/forms';
import { z } from 'zod';

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
        message: errorMessage !== undefined && errorMessage !== '' ? errorMessage : 'Invalid value'
      }
    };
  };
}
