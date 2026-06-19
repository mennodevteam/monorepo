import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, NgIcon],
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.scss',
})
export class AlertComponent {
  type = input<'info' | 'success' | 'warning' | 'error' | 'neutral'>('info');
  title = input<string | undefined>();
  icon = input<string | undefined>();
  dismissible = input<boolean>(false);

  dismissed = output<void>();

  isDismissed = signal(false);

  dismiss() {
    this.isDismissed.set(true);
    this.dismissed.emit();
  }

  getDefaultIcon(): string {
    switch (this.type()) {
      case 'success':
        return 'fa-circle-check';
      case 'warning':
        return 'fa-triangle-exclamation';
      case 'error':
        return 'fa-circle-exclamation';
      case 'neutral':
        return 'fa-bell';
      case 'info':
      default:
        return 'fa-circle-info';
    }
  }
}
