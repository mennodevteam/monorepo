import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    const user = sessionStorage.getItem('appLoginUser') || localStorage.getItem('appLoginUser');
    if (user) {
      try {
        const token = JSON.parse(user).token;
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {}
    }

    return next.handle(request);
  }
}
