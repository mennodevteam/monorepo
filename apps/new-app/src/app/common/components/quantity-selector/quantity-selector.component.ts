import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../..';

@Component({
  selector: 'app-quantity-selector',
  standalone: true,
  imports: [CommonModule, COMMON],
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss',
})
export class QuantitySelectorComponent {
  @Input() value = signal(0);

  plus() {
    this.value.update((v) => v + 1);
  }

  minus() {
    this.value.update((v) => v - 1);
  }
}
