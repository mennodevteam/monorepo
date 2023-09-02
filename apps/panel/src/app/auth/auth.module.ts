import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { authRoutes } from './auth.routes';
import { LoginComponent } from './login/login.component';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RegisterComponent } from './register/register.component';

@NgModule({
  declarations: [LoginComponent, RegisterComponent],
  imports: [CommonModule, RouterModule.forChild(authRoutes), ReactiveFormsModule, SharedModule],
})
export class AuthModule {}
