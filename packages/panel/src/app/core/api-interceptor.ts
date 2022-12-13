import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const IGNORE_CASES = [
  new RegExp('^https?:\\/\\/?'),
  new RegExp('assets/i18n/')
]

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let ignore = false;
    for (const cases of IGNORE_CASES) {
      if (cases.test(request.url)) {
        ignore = true;
        break;
      }
    }
    if (!ignore) {
      request = request.clone({
        url: environment.apiUrl + request.url,
        // withCredentials: true,
        // setHeaders: {
        //   'Content-Type': 'application/json'
        // }
      });
    }

    return next.handle(request);
  }
}