import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxBagOutline } from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, NgIcon],
  providers: [
    provideIcons({
      saxBagOutline,
    }),
  ],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  icon = input<string | undefined>(saxBagOutline);
  text = input<string>('هیچ دیتایی وجود ندارد');
  actionLabel = input<string | undefined>();
  actionClick = output<void>();
}

