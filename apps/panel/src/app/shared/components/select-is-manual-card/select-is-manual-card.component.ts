import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'select-is-manual-card',
  templateUrl: './select-is-manual-card.component.html',
  styleUrls: ['./select-is-manual-card.component.scss'],
})
export class SelectIsManualCardComponent {
  @Input() control: FormControl;
}
