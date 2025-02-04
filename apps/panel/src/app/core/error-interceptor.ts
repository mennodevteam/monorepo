import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiError } from './api-error';
import { environment } from '../../environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // for (const cases of IGNORE_CASES) {
    //   if (cases.test(request.url)) {
    //     ignore = true;
    //     break;
    //   }
    // }
    return next.handle(request).pipe(
      catchError((err) => {
        if (err.status === 401 || err.error?.message == 'Unauthorized') {
          // auto logout if 401 response returned from api
          localStorage.removeItem(environment.localStorageUserKey);
          sessionStorage.removeItem(environment.localStorageUserKey);
        }
        const apiError = new ApiError();
        apiError.data = err.error;
        apiError.message = err.error?.message;
        apiError.status = err.status;
        return throwError(apiError);
      })
    );
  }
}
