import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { appRoutes } from './app.routes';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { JwtInterceptor } from './core/jwt-interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ErrorInterceptor } from './core/error-interceptor';
import { ApiInterceptor } from './core/api.interceptor';
import { PagesComponent } from './pages/pages.component';
import { SharedModule } from './shared/shared.module';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { PaginatorIntl } from './core/mat-paginator-intl';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { MenuCurrencyPipe } from './shared/pipes/menu-currency.pipe';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/');
}

@NgModule({
  declarations: [AppComponent, PagesComponent, NotificationsComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'fa',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    RouterModule.forRoot(appRoutes, {
      initialNavigation: 'enabledBlocking',
      useHash: true,
      scrollPositionRestoration: 'enabled',
    }),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),

    SharedModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
    { provide: MatPaginatorIntl, useClass: PaginatorIntl },
    MenuCurrencyPipe,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
