import {
  HTTP_INTERCEPTORS,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject, Injectable, Provider } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { environment } from '../../../environments/environment';
const JWT_KEY = 'jwtToken';
const IGNORE_CASES = [new RegExp('^https?:\\/\\/?'), new RegExp('/i18n/')];

@Injectable()
class ApiInterceptor implements HttpInterceptor {
  dialog = inject(MatDialog);
  router = inject(Router);
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    let ignore = false;
    for (const cases of IGNORE_CASES) {
      if (cases.test(req.url)) {
        ignore = true;
        break;
      }
    }
    if (!ignore) {
      req = req.clone({
        url: `${environment.apiUrl}${req.url}`,
      });

      const token =
        sessionStorage.getItem(JWT_KEY) || localStorage.getItem(JWT_KEY);

      if (token) {
        if (token) {
          req = req.clone({
            setHeaders: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      }
    }

    return next.handle(req).pipe(
      catchError((err) => {
        if (
          err.status === HttpStatusCode.Unauthorized ||
          err.status === HttpStatusCode.Forbidden
        ) {
          sessionStorage.removeItem(JWT_KEY);
          localStorage.removeItem(JWT_KEY);
          this.router.navigateByUrl('/login');
        } else if (err.status === HttpStatusCode.TooEarly) {
          this.dialog
            .open(AlertDialogComponent, {
              data: {
                title: 'Device Conflict Detected',
                description: `${err.error?.message} Please wait a few minutes and try again.`,
                hideCancel: true,
                okText: 'Reload',
              },
              disableClose: true,
            })
            .afterClosed()
            .subscribe((ok) => {
              if (ok) {
                location.reload();
              }
            });
        }
        return throwError(err);
      }),
    );
  }
}

export const apiInterceptorProvider: () => Provider = () => ({
  provide: HTTP_INTERCEPTORS,
  useClass: ApiInterceptor,
  multi: true,
});
