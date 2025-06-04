# HTTP Интерсептор для типизированной обработки ошибок

## Описание

Интерсептор `ErrorHandlingInterceptor` обеспечивает централизованную обработку HTTP ошибок с типизацией. Он автоматически преобразует все HTTP ошибки в доменные ошибки приложения с правильными типами, используя enum'ы для строгой типизации.

## Возможности

- ✅ Типизированная обработка сетевых ошибок
- ✅ Автоматическое маппирование HTTP статусов в доменные ошибки
- ✅ Интеграция с Result типами из neverthrow
- ✅ Логирование ошибок для отладки
- ✅ Локализованные сообщения об ошибках на русском языке
- ✅ Строгая типизация с использованием enum'ов
- ✅ Автоматический маппинг HTTP статусов через enum

## Enum'ы

### DomainErrorCode

```typescript
export enum DomainErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

### HttpStatusCode

```typescript
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
```

## Типы ошибок

### NetworkError

Для HTTP ошибок (4xx, 5xx статусы):

```typescript
interface NetworkError {
  code: DomainErrorCode.NETWORK_ERROR;
  message: string;
  status?: number;
}
```

### ValidationError

Для ошибок валидации (обычно 400 статус с деталями):

```typescript
interface ValidationError {
  code: DomainErrorCode.VALIDATION_ERROR;
  message: string;
  fields?: Record<string, string[]>;
}
```

### UnknownError

Для непредвиденных ошибок:

```typescript
interface UnknownError {
  code: DomainErrorCode.UNKNOWN_ERROR;
  message: string;
  details?: unknown;
}
```

## Использование в сервисах

### Основной подход

```typescript
import { httpToResult } from '@app/shared/interceptors';

@Injectable()
export class UserService {
  constructor(private http: HttpClient) {}

  getUser(id: number): Observable<Result<User, DomainError>> {
    return httpToResult(this.http.get<User>(`/api/users/${String(id)}`));
  }
}
```

### Обработка результата в компоненте

```typescript
import { DomainErrorCode } from '@app/shared/lib/error-codes.enum';

export class UserComponent {
  // Экспортируем enum для использования в шаблоне
  readonly DomainErrorCode = DomainErrorCode;

  loadUser(id: number): void {
    this.userService.getUser(id).subscribe({
      next: result => {
        result.match(
          user => {
            // Successful result
            this.user = user;
            this.error = null;
          },
          error => {
            // Handle typed error
            this.user = null;
            this.error = error;

            // Can handle different error types via enum
            switch (error.code) {
              case DomainErrorCode.NETWORK_ERROR:
                if (error.status === HttpStatusCode.NOT_FOUND) {
                  this.showNotFound();
                } else if (error.status === HttpStatusCode.UNAUTHORIZED) {
                  this.redirectToLogin();
                }
                break;
              case DomainErrorCode.VALIDATION_ERROR:
                this.showValidationErrors(error.fields);
                break;
              default:
                this.showGenericError();
            }
          }
        );
      },
    });
  }
}
```

### Обработка в шаблоне

```html
<div [ngSwitch]="error.code">
  <div *ngSwitchCase="DomainErrorCode.NETWORK_ERROR" class="network-error">
    <p><strong>Network Error:</strong> {{ error.message }}</p>
    <p><strong>Status:</strong> {{ getNetworkError(error).status }}</p>
  </div>

  <div *ngSwitchCase="DomainErrorCode.VALIDATION_ERROR" class="validation-error">
    <p><strong>Validation Error:</strong> {{ error.message }}</p>
  </div>

  <div *ngSwitchDefault class="unknown-error">
    <p><strong>Unknown Error:</strong> {{ error.message }}</p>
  </div>
</div>
```

## Маппинг HTTP статусов

HTTP статусы автоматически мапятся через `HTTP_ERROR_MESSAGES`:

| HTTP Статус | Enum                                 | Сообщение               |
| ----------- | ------------------------------------ | ----------------------- |
| 0           | HttpStatusCode.NO_CONNECTION         | No connection to server |
| 400         | HttpStatusCode.BAD_REQUEST           | Bad request             |
| 401         | HttpStatusCode.UNAUTHORIZED          | Unauthorized            |
| 403         | HttpStatusCode.FORBIDDEN             | Access forbidden        |
| 404         | HttpStatusCode.NOT_FOUND             | Resource not found      |
| 408         | HttpStatusCode.REQUEST_TIMEOUT       | Request timeout         |
| 409         | HttpStatusCode.CONFLICT              | Data conflict           |
| 429         | HttpStatusCode.TOO_MANY_REQUESTS     | Too many requests       |
| 500         | HttpStatusCode.INTERNAL_SERVER_ERROR | Internal server error   |
| 502         | HttpStatusCode.BAD_GATEWAY           | Bad gateway             |
| 503         | HttpStatusCode.SERVICE_UNAVAILABLE   | Service unavailable     |
| 504         | HttpStatusCode.GATEWAY_TIMEOUT       | Gateway timeout         |

## Утилиты

### httpToResult

Конвертирует HTTP Observable в Result тип:

```typescript
httpToResult<T>(httpCall: Observable<T>): Observable<Result<T, DomainError>>
```

### resultToHttp

Конвертирует Result обратно в Observable (редко используется):

```typescript
resultToHttp<T>(result: Observable<Result<T, DomainError>>): Observable<T>
```

## Логирование

Интерсептор автоматически логирует все ошибки в консоль с деталями запроса:

```
HTTP Error intercepted: {
  url: "/api/users/123",
  method: "GET",
  error: {
    code: "NETWORK_ERROR",
    message: "Resource not found",
    status: 404
  }
}
```

## Настройка

Интерсептор автоматически подключается через `app.config.ts`:

```typescript
{
  provide: HTTP_INTERCEPTORS,
  useClass: ErrorHandlingInterceptor,
  multi: true,
}
```

## Преимущества enum'ов

1. **Автодополнение**: IDE предлагает доступные значения
2. **Refactoring**: Безопасное переименование во всем коде
3. **Типизация**: Невозможно использовать неверные значения
4. **Централизация**: Все коды ошибок в одном месте
5. **Читаемость**: Код становится более понятным

## Пример полного workflow с enum'ами

```typescript
import { DomainErrorCode, HttpStatusCode } from '@app/shared/lib/error-codes.enum';

// 1. Service returns Result
userService.createUser(userData).pipe(
  // 2. Handle success and errors
  tap(result => result.match(
    user => this.onUserCreated(user),
    error => this.handleError(error)
  ))
).subscribe();

private handleError(error: DomainError): void {
  switch (error.code) {
    case DomainErrorCode.VALIDATION_ERROR:
      // Show validation errors in form
      this.showFieldErrors(error.fields);
      break;

    case DomainErrorCode.NETWORK_ERROR:
      if (error.status === HttpStatusCode.CONFLICT) {
        // User already exists
        this.showUserExistsError();
      } else if (error.status === HttpStatusCode.UNAUTHORIZED) {
        // Redirect to login
        this.redirectToLogin();
      } else {
        this.showNetworkError(error);
      }
      break;

    case DomainErrorCode.UNKNOWN_ERROR:
    default:
      // General error handling
      this.showGenericError(error.message);
  }
}
```
