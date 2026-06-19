import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { SHARED } from '../shared';

@Component({
  selector: 'app-ai-hub',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
  ],
  templateUrl: './ai-hub.component.html',
  styleUrl: './ai-hub.component.scss',
})
export class AiHubComponent {
  private readonly router = inject(Router);

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}
