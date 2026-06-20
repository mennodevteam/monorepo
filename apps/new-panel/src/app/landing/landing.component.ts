import { Component, inject } from '@angular/core';
import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreatorMessageDialogComponent } from './creator-message-dialog.component';
import { SoonDialogComponent } from './soon-dialog.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private readonly dialog = inject(MatDialog);

  openCreatorMessage() {
    this.dialog.open(CreatorMessageDialogComponent, {
      maxWidth: '650px',
      width: '90%',
    });
  }

  openSoonDialog() {
    this.dialog.open(SoonDialogComponent, {
      maxWidth: '500px',
      width: '90%',
    });
  }

  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
