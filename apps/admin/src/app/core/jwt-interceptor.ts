import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';
import { IGNORE_CASES } from './api.interceptor';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let ignore = false;
    for (const cases of IGNORE_CASES) {
      if (cases.test(request.url)) {
        ignore = true;
        break;
      }
    }
    // add authorization header with jwt token if available
    if (!ignore) {
      const user = this.auth.instantUser;
      if (user && user.token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      }
    }

    return next.handle(request);
  }
}
