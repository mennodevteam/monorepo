import { HTTP_INTERCEPTORS, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Provider } from '@angular/core';
import { environment } from '../../../environments/environment';

const IGNORE_PATTERNS = [/^https?:\/\//, /\/i18n\//];

@Injectable()
class ApiInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const shouldIgnore = IGNORE_PATTERNS.some((pattern) => pattern.test(request.url));

    if (!shouldIgnore) {
      request = request.clone({ url: `${environment.apiUrl}/${request.url}` });

      if (!request.headers.has('skipJwt')) {
        const persistedUser = sessionStorage.getItem('appLoginUser') ?? localStorage.getItem('appLoginUser');

        if (persistedUser) {
          try {
            const token = JSON.parse(persistedUser).token as string | undefined;

            if (token) {
              request = request.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`,
                },
              });
            }
          } catch (error) {
            console.error('Failed to parse user token from storage', error);
          }
        }
      }
    }

    return next.handle(request);
  }
}

export const apiInterceptorProvider: () => Provider = () => ({
  provide: HTTP_INTERCEPTORS,
  useClass: ApiInterceptor,
  multi: true,
});

