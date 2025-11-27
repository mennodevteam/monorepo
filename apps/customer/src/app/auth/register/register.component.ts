import { Component, inject, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '@menno/types';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    TopAppBarComponent,
    FormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  loading = signal(false);
  firstName = signal('');
  lastName = signal('');

  private auth = inject(AuthService);
  private location = inject(PlatformLocation);

  constructor() {
    this.firstName.set(this.auth?.user()?.firstName || '');
    this.lastName.set(this.auth?.user()?.lastName || '');
  }

  get dto() {
    return {
      firstName: this.firstName(),
      lastName: this.lastName(),
    };
  }

  async submit(ev: Event) {
    if (this.firstName() && this.lastName()) {
      const dto = this.dto;
      try {
        this.loading.set(true);
        await this.auth.update(dto as User);
      } catch (error) {
        // Handle error
      }
      this.location.back();
    }
  }
}
