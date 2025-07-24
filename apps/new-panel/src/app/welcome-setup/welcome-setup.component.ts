import { Component } from '@angular/core';
import { SHARED } from '../shared';
import { MatCardModule } from '@angular/material/card';
import { PhoneVerificationComponent } from './phone-verification/phone-verification.component';

@Component({
  selector: 'app-welcome-setup',
  standalone: true,
  imports: [SHARED, MatCardModule, PhoneVerificationComponent],
  templateUrl: './welcome-setup.component.html',
  styleUrl: './welcome-setup.component.scss',
})
export class WelcomeSetupComponent {}
