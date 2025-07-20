import { Component, inject, signal } from '@angular/core';

import { SHARED } from '../shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    SHARED,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    RouterModule
],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  
  loginForm = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });
  
  isLoading = signal(false);

  async submit() {
    const { username, password } = this.loginForm.getRawValue();
    if (this.loginForm.invalid || !username || !password) return;
    
    this.isLoading.set(true);
    try {
      await this.auth.login(username, password);
      this.router.navigateByUrl('/', {
        replaceUrl: true,
      });
    } catch (error) {
      this.snack.open('نام کابری یا رمز عبور اشتباه است', '', {
        duration: 2000,
      });
    } finally {
      this.isLoading.set(false);
    }
  }
}
