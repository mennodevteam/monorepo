import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SHARED } from './shared';
import { AuthService } from './auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterModule, MatToolbarModule, SHARED],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  auth = inject(AuthService)
}
