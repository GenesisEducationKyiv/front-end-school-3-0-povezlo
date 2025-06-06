import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { z } from 'zod';
import { Result } from 'neverthrow';
import { BaseApiService, isDefined, isObject, RequestOptions } from '@app/shared';
import { DomainError } from '@app/shared/lib/result';

/**
 * An abstract service facade that automatically adds validation to API methods
 * Inheritors must define validation schemas and use standard CRUD methods.
 */
@Injectable()
export abstract class ValidatedApiService<
  TEntity = unknown,
  TCreateDto = unknown,
  TUpdateDto = unknown
> extends BaseApiService {

  // Abstract schemas that must be defined in descendants
  protected abstract readonly entitySchema: z.ZodSchema<TEntity>;
  protected abstract readonly createSchema?: z.ZodSchema<TCreateDto>;
  protected abstract readonly updateSchema?: z.ZodSchema<TUpdateDto>;

  /**
   * GET request with automatic validation
   * Overrides the base method for automatic validation application
   */
  protected get<T = TEntity>(
    url: string,
    options?: RequestOptions
  ): Observable<Result<T, DomainError>> {
    const schema = this.getResponseSchema<T>();
    return this.getValidated(url, schema, options);
  }

  /**
   * Get list with automatic validation
   */
  protected getList<T = TEntity>(
    endpoint: string,
    params?: Record<string, string | number>
  ): Observable<Result<T[], DomainError>> {
    return this.getListValidated(endpoint, this.entitySchema as unknown as z.ZodSchema<T>, params);
  }

  /**
   * Get by ID with automatic validation
   */
  protected getById<T = TEntity>(
    endpoint: string,
    id: string | number
  ): Observable<Result<T, DomainError>> {
    return this.getByIdValidated(endpoint, id, this.entitySchema as unknown as z.ZodSchema<T>);
  }

  /**
   * Create with automatic validation
   */
  protected create<T = TEntity>(
    endpoint: string,
    data: unknown
  ): Observable<Result<T, DomainError>> {
    return this.createValidated(
      endpoint,
      data,
      this.entitySchema as unknown as z.ZodSchema<T>,
      this.createSchema
    );
  }

  /**
   * Update with automatic validation
   */
  protected update<T = TEntity>(
    endpoint: string,
    id: string | number,
    data: unknown
  ): Observable<Result<T, DomainError>> {
    return this.updateValidated(
      endpoint,
      id,
      data,
      this.entitySchema as unknown as z.ZodSchema<T>,
      this.updateSchema
    );
  }

  /**
   * Gets schema for response type
   */
  private getSchemaForType<T>(): z.ZodSchema<T> {
    // In most cases, we use the entity schema.
    // Inheritors can override this method for more complex logic.
    return this.entitySchema as unknown as z.ZodSchema<T>;
  }

  /**
   * Determines request schema based on request body
   */
  private getRequestSchema(body: unknown): z.ZodSchema | undefined {
    // Don't validate FormData (for file uploads)
    if (body instanceof FormData) {
      return undefined;
    }

    // Simple heuristics: if body looks like creation, use createSchema
    // Inheritors can override for more accurate logic
    if (isDefined(this.createSchema) && this.looksLikeCreateRequest(body)) {
      return this.createSchema;
    }
    if (isDefined(this.updateSchema) && this.looksLikeUpdateRequest(body)) {
      return this.updateSchema;
    }
    return undefined;
  }

  /**
   * Determines schema for delete operation
   */
  private getDeleteSchema<T>(): z.ZodSchema<T> {
    // By default DELETE returns boolean
    // Inheritors can override for more complex logic
    return z.boolean() as unknown as z.ZodSchema<T>;
  }

  /**
   * Checks if request body looks like entity creation
   */
  private looksLikeCreateRequest(body: unknown): boolean {
    // Simple check: if body has no id, it's likely a creation
    return isObject(body) && !('id' in body);
  }

  /**
   * Checks if request body looks like entity update
   */
  private looksLikeUpdateRequest(body: unknown): boolean {
    // If has id or is partial object, it's likely an update
    return isObject(body);
  }

  // Overridable methods for validation customization

  /**
   * Allows inheritors to override response schema selection logic
   */
  protected getResponseSchema<T>(): z.ZodSchema<T> {
    return this.getSchemaForType<T>();
  }

  /**
   * Allows inheritors to override request schema selection logic
   */
  protected getRequestSchemaForBody(body: unknown): z.ZodSchema | undefined {
    // Don't validate FormData (for file uploads)
    if (body instanceof FormData) {
      return undefined;
    }

    return this.getRequestSchema(body);
  }

  /**
   * Allows inheritors to override schema for DELETE operations
   */
  protected getDeleteResponseSchema<T>(): z.ZodSchema<T> {
    return this.getDeleteSchema<T>();
  }

  // Additional methods for convenience

  /**
   * Data validation using entity schema
   */
  protected validateEntity(data: unknown): Result<TEntity, DomainError> {
    return this.validate(data, this.entitySchema);
  }

  /**
   * Data validation for creation
   */
  protected validateCreateData(data: unknown): Result<TCreateDto, DomainError> {
    if (this.createSchema === undefined) {
      throw new Error('Create schema is not defined');
    }
    return this.validate(data, this.createSchema);
  }

  /**
   * Data validation for updates
   */
  protected validateUpdateData(data: unknown): Result<TUpdateDto, DomainError> {
    if (this.updateSchema === undefined) {
      throw new Error('Update schema is not defined');
    }
    return this.validate(data, this.updateSchema);
  }
}
