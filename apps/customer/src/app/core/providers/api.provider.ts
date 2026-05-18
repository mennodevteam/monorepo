import { isPlatformServer } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, PLATFORM_ID, Provider, inject } from '@angular/core';
import { logSsrApiConfigOnce, ssrLog } from '../functions/ssr-logger';
import { getClientApiUrl, getServerApiUrl } from '../functions/server-api-url';

const IGNORE_PATTERNS = [/^https?:\/\//, /\/i18n\//];

@Injectable()
class ApiInterceptor implements HttpInterceptor {
  private readonly platformId = inject(PLATFORM_ID);

  intercept(request: HttpRequest<unknown>, next: HttpHandler) {
    const shouldIgnore = IGNORE_PATTERNS.some((pattern) => pattern.test(request.url));

    if (!shouldIgnore) {
      const onServer = isPlatformServer(this.platformId);
      const baseUrl = onServer ? getServerApiUrl() : getClientApiUrl();
      if (onServer) {
        logSsrApiConfigOnce();
        ssrLog.debug('http request', { method: request.method, path: request.url, baseUrl });
      }
      request = request.clone({ url: `${baseUrl}/${request.url}` });

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
