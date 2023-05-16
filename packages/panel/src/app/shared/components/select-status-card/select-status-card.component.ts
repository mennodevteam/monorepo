import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Status } from '@menno/types';

@Component({
  selector: 'select-status-card',
  templateUrl: './select-status-card.component.html',
  styleUrls: ['./select-status-card.component.scss'],
})
export class SelectStatusCardComponent {
  Status = Status;
  @Input() control: FormControl;
  @Input() showBlocked = false;
}
