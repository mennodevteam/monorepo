import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { FilterMemberV2ResponseDto, User } from '@menno/types';
import { DataLoadingComponent } from '../../../shared/components/data-loading/data-loading.component';
import { PdatePipe } from '../../../shared/pipes/pdate.pipe';
import { SHARED } from '../../../shared';

@Component({
  selector: 'app-members-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, DataLoadingComponent, PdatePipe, SHARED],
  templateUrl: './members-table.component.html',
  styleUrl: './members-table.component.scss',
})
export class MembersTableComponent {
  User = User;
  data = input<FilterMemberV2ResponseDto[] | undefined>();

  displayedColumns = [
    'index',
    'fullName',
    'mobilePhone',
    'joinedAt',
    'firstOrderTime',
    'lastOrderTime',
    'lastVisitDate',
    'totalOrderCount',
    'totalOrderSum',
  ];
}
