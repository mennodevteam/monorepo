import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertDialogComponent } from '@shared/dialogs/alert-dialog/alert-dialog.component';
import { environment } from '@env/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  noInternetDialogVisibility = false;
  constructor(
    private auth: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    // private translate: TranslateService,
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(catchError(err => {
      if (err.url.search(environment.apiUrl) === -1) return throwError(err);
      if (err.status === 401) {
        // auto logout if 401 response returned from api
        this.auth.logout();
        // location.reload(true);
      }
      if (!err.status) {
        if (navigator.onLine) {
          this.snackBar.open('پاسخی از سمت سرور دریافت نشد', '', {panelClass: 'error'});
        } else {
          setTimeout(() => {
            if (!navigator.onLine && !this.noInternetDialogVisibility) {
              this.noInternetDialogVisibility = true;
              this.dialog.open(AlertDialogComponent, {
                disableClose: true,
                data: {
                  title: 'عدم دسترسی به اینترنت',
                  description: 'لطفا اینترنت سیستم را بررسی کنید و برنامه را مجددا اجرا کنید',
                  okText: 'اجرای مجدد برنامه',
                }
              }).afterClosed().subscribe((val) => {
                if (val) {
                  location.reload();
                }
                this.noInternetDialogVisibility = false;
              })
            }
          }, 10000);
        }
      }
      const error = {
        status: err.status,
        message: err.error.message
      }
      return throwError(error);
    }))
  }
}