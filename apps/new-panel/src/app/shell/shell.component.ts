import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { SHARED } from '../shared';
import { AuthService } from '../auth/auth.service';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    RouterModule,
    MatTooltipModule,
    SHARED,
    RouterModule,
    MatMenuModule,
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
}
