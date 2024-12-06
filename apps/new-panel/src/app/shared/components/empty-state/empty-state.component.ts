import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED_MODULES } from '../../modules';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, SHARED_MODULES],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  icon = input<string | undefined>();
  text = input<string>('هیچ دیتایی وجود ندارد');
}
