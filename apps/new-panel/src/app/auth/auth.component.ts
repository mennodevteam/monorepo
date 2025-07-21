import { Component } from '@angular/core';
import { SHARED } from '../shared';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [SHARED, MatCardModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
})
export class AuthComponent {}
