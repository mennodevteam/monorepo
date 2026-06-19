import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_MODULES } from '../../modules';
import { MatButtonModule } from '@angular/material/button';
import { mapFaIcon } from '../../utils/icon-mapper';
import { NgIcon } from '@ng-icons/core';

export interface EmptyStateAction {
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, SHARED_MODULES, MatButtonModule, NgIcon],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  icon = input<string | undefined>();
  text = input<string | string[]>('هیچ دیتایی وجود ندارد');
  action = input<EmptyStateAction | undefined>();
  actionClick = output<void>();

  getIconName(iconName: string | undefined): string {
    return mapFaIcon(iconName);
  }
}
