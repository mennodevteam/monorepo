import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { Status } from '@menno/types';
import { SHARED } from '../..';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [CommonModule, MatChipsModule, SHARED, MatMenuModule],
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.scss',
})
export class StatusChipComponent {
  Status = Status;
  status = input<Status | null | undefined>(null);
  justActiveInActive = input(false);
  title = input('');
  disabled = input(false);
  statusChange = output<Status>();
}
