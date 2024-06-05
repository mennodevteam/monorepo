import { HTTP_INTERCEPTORS, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
const JWT_KEY = 'jwtToken';
const IGNORE_CASES = [new RegExp('^https?:\\/\\/?'), new RegExp('assets/i18n/')];

@Injectable()
class ApiInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    let ignore = false;
    for (const cases of IGNORE_CASES) {
      if (cases.test(req.url)) {
        ignore = true;
        break;
      }
    }
    if (!ignore) {
      const jwtToken = localStorage.getItem(JWT_KEY);

      req = req.clone({
        url: `${environment.apiUrl}/${req.url}`,
      });

      if (jwtToken) {
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
      }
    }

    return next.handle(req);
  }
}

export const apiInterceptorProvider: Provider = {
  provide: HTTP_INTERCEPTORS,
  useClass: ApiInterceptor,
  multi: true,
};
