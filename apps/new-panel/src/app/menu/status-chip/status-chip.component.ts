import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { Status } from '@menno/types';
import { SHARED } from '../../shared';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-menu-status-chip',
  standalone: true,
  imports: [CommonModule, MatChipsModule, SHARED, MatMenuModule],
  templateUrl: './status-chip.component.html',
  styleUrl: './status-chip.component.scss',
})
export class MenuStatusChipComponent {
  Status = Status;
  status = input<Status | null | undefined>(null);
  title = input('');
  disabled = input(false);
  statusChange = output<Status>();
}
