import { Component, Input, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { COMMON } from '../../common';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TopAppBarComponent } from '../../common/components';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, COMMON, MatFormField, MatInputModule, TopAppBarComponent, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  formGroup: FormGroup;
  loading = signal(false);

  constructor(
    private auth: AuthService,
    private location: PlatformLocation,
  ) {
    this.formGroup = new FormGroup({
      firstName: new FormControl(this.auth?.user()?.firstName, Validators.required),
      lastName: new FormControl(this.auth?.user()?.lastName, Validators.required),
    });
  }

  get dto() {
    return this.formGroup.getRawValue();
  }

  async submit(ev: Event) {
    if (this.formGroup.valid) {
      const dto = this.dto;
      try {
        this.loading.set(true);
        await this.auth.update(dto);
      } catch (error) {
        //
      }
      this.location.back();
    }
  }
}
