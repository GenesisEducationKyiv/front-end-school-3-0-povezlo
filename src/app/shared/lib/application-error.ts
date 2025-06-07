import { ZodError } from 'zod';
import { isDefined } from '@app/shared';

export type ErrorTypePrimitive = string | number | symbol;

export class ApplicationError<
  TErrorType extends ErrorTypePrimitive = ErrorTypePrimitive
> extends Error {
  public type: TErrorType;
  public override cause: unknown;
  public details: Record<string, unknown> | undefined;

  constructor(
    ...args:
      | [TErrorType]
      | [TErrorType, string]
      | [TErrorType, string, Record<string, unknown> | undefined]
  ) {
    if (args.length === 3) {
      const [type, message, details] = args;
      super(message);
      this.type = type;
      this.details = details;
    } else if (args.length === 2) {
      const [type, message] = args;
      super(message);
      this.type = type;
      this.details = undefined;
    } else {
      const [type] = args;
      super('');
      this.type = type;
      this.details = undefined;
    }
    this.name = `ApplicationError[${String(this.type)}]`;
  }

  is<TErrorTypeCase extends TErrorType = TErrorType>(
    type: TErrorTypeCase | TErrorTypeCase[] | Record<string, TErrorTypeCase>
  ): this is ApplicationError<TErrorTypeCase> {
    if (
      typeof type === 'string' ||
      typeof type === 'symbol' ||
      typeof type === 'number'
    ) {
      return this.type === type;
    }

    if (Array.isArray(type)) {
      return type.some((t) => t === this.type);
    }

    if (typeof type === 'object') {
      return Object.values(type).some((t) => t === this.type);
    }

    return false;
  }

  unwrap(): unknown {
    return this.cause;
  }

  static is(error: unknown): error is ApplicationError {
    if (error == null || typeof error !== 'object') {
      return false;
    }

    if (error instanceof ApplicationError) {
      return true;
    }

    return (
      'type' in error &&
      'message' in error &&
      (typeof error.type === 'string' ||
        typeof error.type === 'number' ||
        typeof error.type === 'symbol')
    );
  }

  static isOfType<TErrorType extends ErrorTypePrimitive>(
    errorType: TErrorType | TErrorType[] | Record<string, TErrorType>,
    error: unknown
  ): error is ApplicationError<TErrorType> {
    if (!ApplicationError.is(error)) {
      return false;
    }

    if (
      typeof errorType === 'string' ||
      typeof errorType === 'symbol' ||
      typeof errorType === 'number'
    ) {
      return error.type === errorType;
    } else if (Array.isArray(errorType)) {
      return errorType.some((type) => type === error.type);
    } else if (typeof errorType === 'object') {
      return Object.values(errorType).some((type) => type === error.type);
    }

    return false;
  }

  static wrap<TErrorType extends ErrorTypePrimitive>(
    error: unknown,
    type: TErrorType,
    details?: Record<string, unknown>
  ): ApplicationError<TErrorType> {
    let message = 'Unknown error';
    let errorDetails = details ?? {};

    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error != null && typeof error === 'object') {
      message = JSON.stringify(error);
    }

    // Zod error handling
    if (error instanceof ZodError) {
      message = 'Validation failed';
      errorDetails = {
        ...errorDetails,
        zodIssues: error.issues,
        validationErrors: error.issues.reduce<Record<string, string[]>>((acc, issue) => {
          const path = issue.path.join('.');
          if (!isDefined(acc[path])) {
            acc[path] = [];
          }
          acc[path].push(issue.message);
          return acc;
        }, {})
      };
    }

    const applicationError = new ApplicationError(type, message, errorDetails);
    applicationError.cause = error;

    if (error instanceof Error && error.stack != null) {
      applicationError.stack = error.stack;
    }

    return applicationError;
  }

  // Utility for creating ValidationError from Zod
  static fromZodError<TErrorType extends ErrorTypePrimitive>(
    zodError: ZodError,
    type: TErrorType,
    message?: string
  ): ApplicationError<TErrorType> {
    const validationErrors = zodError.issues.reduce<Record<string, string[]>>((acc, issue) => {
      const path = issue.path.join('.');
      if (!isDefined(acc[path])) {
        acc[path] = [];
      }
      acc[path].push(issue.message);
      return acc;
    }, {});

    return new ApplicationError(
      type,
      message ?? 'Validation failed',
      {
        zodIssues: zodError.issues,
        validationErrors
      }
    );
  }

  // Utility for checking whether the Zod error is a validation error
  isZodValidationError(): boolean {
    return isDefined(this.details?.['zodIssues']);
  }

  // Receive validation errors in a convenient format
  getValidationErrors(): Record<string, string[]> | null {
    return this.details?.['validationErrors'] as Record<string, string[]> | null;
  }
}

// Specific error types for trackfing compatible with DomainErrorCode
export enum TrackDomainError {
  FETCH_ERROR = 'TRACK_FETCH_ERROR',
  CREATE_ERROR = 'TRACK_CREATE_ERROR',
  UPDATE_ERROR = 'TRACK_UPDATE_ERROR',
  DELETE_ERROR = 'TRACK_DELETE_ERROR',
  VALIDATION_ERROR = 'TRACK_VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'TRACK_NOT_FOUND_ERROR',
  UPLOAD_ERROR = 'TRACK_UPLOAD_ERROR'
}

export enum GenreDomainError {
  FETCH_ERROR = 'GENRE_FETCH_ERROR',
  NOT_FOUND_ERROR = 'GENRE_NOT_FOUND_ERROR'
}

// Types for compatibility with old code
export type TrackError = ApplicationError<TrackDomainError>;
export type GenreError = ApplicationError<GenreDomainError>;

// Factory functions for creating specific errors
export const TrackErrors = {
  fetchError: (message?: string, details?: Record<string, unknown>): TrackError =>
    new ApplicationError(TrackDomainError.FETCH_ERROR, message ?? 'Failed to fetch tracks', details),

  createError: (message?: string, details?: Record<string, unknown>): TrackError =>
    new ApplicationError(TrackDomainError.CREATE_ERROR, message ?? 'Failed to create track', details),

  updateError: (message?: string, details?: Record<string, unknown>): TrackError =>
    new ApplicationError(TrackDomainError.UPDATE_ERROR, message ?? 'Failed to update track', details),

  deleteError: (message?: string, details?: Record<string, unknown>): TrackError =>
    new ApplicationError(TrackDomainError.DELETE_ERROR, message ?? 'Failed to delete track', details),

  validationError: (zodError: ZodError): TrackError =>
    ApplicationError.fromZodError(zodError, TrackDomainError.VALIDATION_ERROR),

  notFoundError: (trackId?: string): TrackError =>
    new ApplicationError(
      TrackDomainError.NOT_FOUND_ERROR,
      `Track ${trackId ?? ''} not found`
    ),

  uploadError: (message?: string, details?: Record<string, unknown>): TrackError =>
    new ApplicationError(TrackDomainError.UPLOAD_ERROR, message ?? 'Failed to upload file', details)
};

export const GenreErrors = {
  fetchError: (message?: string, details?: Record<string, unknown>): GenreError =>
    new ApplicationError(GenreDomainError.FETCH_ERROR, message ?? 'Failed to fetch genres', details),

  notFoundError: (): GenreError =>
    new ApplicationError(GenreDomainError.NOT_FOUND_ERROR, 'Genres not found')
};
