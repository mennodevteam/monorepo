import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { OtpComponent } from './otp/otp.component';

export const authRoutes: Route[] = [
  { path: '', component: LoginComponent, data: { animation: 'login' } },
  { path: 'otp', component: OtpComponent, data: { animation: 'otp' } },
];
