import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'count-selector',
  templateUrl: './count-selector.component.html',
  styleUrls: ['./count-selector.component.scss'],
})
export class CountSelectorComponent {
  @Input() count = 0;
  @Input() min = 0;
  @Input() max?: number;
  @Output() plusClick = new EventEmitter<void>();
  @Output() minusClick = new EventEmitter<void>();
  @Output() countChange = new EventEmitter<number>();

  plus() {
    if (!this.max || this.count + 1 <= this.max) {
      this.count++;
      this.countChange.emit(this.count);
      this.plusClick.emit();
    }
  }

  minus() {
    if (this.min == undefined || this.count - 1 >= this.min) {
      this.count--;
      this.countChange.emit(this.count);
      this.minusClick.emit();
    }
  }
}
