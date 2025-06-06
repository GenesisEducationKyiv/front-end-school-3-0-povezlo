export enum DomainErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum HttpStatusCode {
  NO_CONNECTION = 0,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  REQUEST_TIMEOUT = 408,
  CONFLICT = 409,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export const HTTP_ERROR_MESSAGES: Record<HttpStatusCode, string> = {
  [HttpStatusCode.NO_CONNECTION]: 'No connection to server',
  [HttpStatusCode.BAD_REQUEST]: 'Bad request',
  [HttpStatusCode.UNAUTHORIZED]: 'You need to log in to access this resource',
  [HttpStatusCode.FORBIDDEN]: 'You do not have permission to access this resource',
  [HttpStatusCode.NOT_FOUND]: 'The requested resource was not found',
  [HttpStatusCode.REQUEST_TIMEOUT]: 'Request timeout',
  [HttpStatusCode.CONFLICT]: 'Data conflict',
  [HttpStatusCode.TOO_MANY_REQUESTS]: 'Too many requests',
  [HttpStatusCode.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [HttpStatusCode.BAD_GATEWAY]: 'Bad gateway',
  [HttpStatusCode.SERVICE_UNAVAILABLE]: 'Server error. Please try again later',
  [HttpStatusCode.GATEWAY_TIMEOUT]: 'Gateway timeout',
};
