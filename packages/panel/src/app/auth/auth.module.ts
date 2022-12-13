import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { authRoutes } from './auth.routes';
import { LoginComponent } from './login/login.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RegisterComponent } from './register/register.component';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [LoginComponent, RegisterComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(authRoutes),
    SharedModule,
  ]
})
export class AuthModule { }
