import { Component, input, output } from '@angular/core';

import { SHARED_MODULES } from '../../modules';
import { MatButtonModule } from '@angular/material/button';

export interface EmptyStateAction {
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [SHARED_MODULES, MatButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  icon = input<string | undefined>();
  text = input<string | string[]>('هیچ دیتایی وجود ندارد');
  action = input<EmptyStateAction | undefined>();
  actionClick = output<void>();
}
