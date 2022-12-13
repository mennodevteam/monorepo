import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';

export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'rgs', component: RegisterComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];