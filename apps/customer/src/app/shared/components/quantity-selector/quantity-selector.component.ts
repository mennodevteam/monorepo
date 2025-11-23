import { ChangeDetectionStrategy, Component, effect, input, output, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxAddSquareOutline, saxMinusSquareOutline } from '@ng-icons/iconsax/outline';
import { saxAddSquareBold } from '@ng-icons/iconsax/bold';

@Component({
  selector: 'app-quantity-selector',
  imports: [NgIcon, MatButtonModule],
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'quantity-selector',
  },
  providers: [
    provideIcons({
      saxAddSquareOutline,
      saxMinusSquareOutline,
      saxAddSquareBold,
    }),
  ],
})
export class QuantitySelectorComponent {
  readonly quantity = input(0);
  readonly min = input(0);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  readonly disabled = input(false);

  readonly quantityChange = output<number>();

  readonly incrementIcon = saxAddSquareOutline;
  readonly decrementIcon = saxMinusSquareOutline;
  readonly addIcon = saxAddSquareBold;

  private readonly current = signal(1);

  private readonly effectiveStep = computed(() => {
    const value = this.step();
    if (!Number.isFinite(value) || value <= 0) {
      return 1;
    }
    return value;
  });

  readonly value = computed(() => this.current());

  readonly canDecrement = computed(() => {
    if (this.disabled()) {
      return false;
    }
    return this.current() > this.effectiveMin();
  });

  readonly canIncrement = computed(() => {
    if (this.disabled()) {
      return false;
    }
    const max = this.effectiveMax();
    if (max === null) {
      return true;
    }
    return this.current() < max;
  });

  constructor() {
    effect(() => {
      const fromInput = this.quantity();
      const next = this.clamp(fromInput);
      if (next !== this.current()) {
        this.current.set(next);
      }
    });
  }

  decrement(): void {
    if (!this.canDecrement()) {
      return;
    }

    const min = this.effectiveMin();
    const step = this.effectiveStep();

    const next = Math.max(min, this.current() - step);
    this.update(next);
  }

  increment(): void {
    if (!this.canIncrement()) {
      return;
    }

    const max = this.effectiveMax();
    const step = this.effectiveStep();

    const next = max === null ? this.current() + step : Math.min(max, this.current() + step);
    this.update(next);
  }

  private update(next: number): void {
    const clamped = this.clamp(next);
    if (clamped === this.current()) {
      return;
    }
    this.current.set(clamped);
    this.quantityChange.emit(clamped);
  }

  private clamp(value: number): number {
    const min = this.effectiveMin();
    const max = this.effectiveMax();

    let candidate = Number.isFinite(value) ? value : min;

    if (candidate < min) {
      candidate = min;
    }

    if (max !== null && candidate > max) {
      candidate = max;
    }

    return candidate;
  }

  private effectiveMin(): number {
    const value = this.min();
    if (!Number.isFinite(value)) {
      return 0;
    }
    return value;
  }

  private effectiveMax(): number | null {
    const rawMax = this.max();
    if (!Number.isFinite(rawMax)) {
      return null;
    }
    const min = this.effectiveMin();
    if (rawMax !== null && rawMax <= min) {
      return min;
    }
    return rawMax;
  }
}
