import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SHARED } from '../../shared';
import { MatIconModule } from '@angular/material/icon';

export interface ContentDialogData {
  title: string;
  content: string;
  filename: string;
  contentType: 'json' | 'toon';
}

@Component({
  selector: 'app-content-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    SHARED,
  ],
  templateUrl: './content-dialog.component.html',
  styleUrl: './content-dialog.component.scss',
})
export class ContentDialogComponent {
  readonly data = inject<ContentDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<ContentDialogComponent>);
  private snackBar = inject(MatSnackBar);

  get title(): string {
    return this.data.title;
  }

  get content(): string {
    return this.data.content;
  }

  get filename(): string {
    return this.data.filename;
  }

  get mimeType(): string {
    return this.data.contentType === 'json' 
      ? 'application/json;charset=utf-8;' 
      : 'text/plain;charset=utf-8;';
  }

  copyToClipboard() {
    // Create a temporary textarea element to select and copy text
    const textarea = document.createElement('textarea');
    textarea.value = this.content;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        this.snackBar.open('کپی شد', '', { duration: 1500 });
      } else {
        // Fallback to clipboard API
        navigator.clipboard.writeText(this.content).then(() => {
          this.snackBar.open('کپی شد', '', { duration: 1500 });
        }).catch(() => {
          this.snackBar.open('خطا در کپی', '', { duration: 2000 });
        });
      }
    } catch (err) {
      // Fallback to clipboard API
      navigator.clipboard.writeText(this.content).then(() => {
        this.snackBar.open('کپی شد', '', { duration: 1500 });
      }).catch(() => {
        this.snackBar.open('خطا در کپی', '', { duration: 2000 });
      });
    } finally {
      document.body.removeChild(textarea);
    }
  }

  download() {
    const blob = new Blob([this.content], { type: this.mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

