import { Component, input, Output, EventEmitter, ViewChild, Input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { FilterMemberV2ResponseDto, Member, User } from '@menno/types';
import { DataLoadingComponent } from '../../../shared/components/data-loading/data-loading.component';
import { PdatePipe } from '../../../shared/pipes/pdate.pipe';
import { SHARED } from '../../../shared';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';

@Component({
  selector: 'app-members-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, DataLoadingComponent, PdatePipe, SHARED, MatSortModule],
  templateUrl: './members-table.component.html',
  styleUrl: './members-table.component.scss',
})
export class MembersTableComponent {
  User = User;
  data = input<FilterMemberV2ResponseDto[] | undefined>();
  startIndex = input<number>(0);

  @ViewChild(MatSort) sort!: MatSort;
  @Output() sortChange = new EventEmitter<{ sortBy: string; sortType: 'ASC' | 'DESC' }>();
  @Output() starClick = new EventEmitter<Member>();
  @Output() walletClick = new EventEmitter<Member>();
  
  sortBy = input<string | undefined>('joinedAt');
  sortType = input<'ASC' | 'DESC' | undefined>('DESC');

  displayedColumns = [
    'index',
    'fullName',
    'mobilePhone',
    'joinedAt',
    'lastVisitDate',
    'firstOrderTime',
    'lastOrderTime',
    'totalOrderCount',
    'totalOrderSum',
    'star',
    'wallet',
  ];

  // constructor() {
  //   effect(() => {
  //     // Only run if both are defined and sort is available
  //     if (this.sortBy() && this.sortType()) {
  //       this.setSortState();
  //     }
  //   });
  // }

  // setSortState() {
  //   console.log('setSortState', this.sort, this.sortBy(), this.sortType());
  //   if (this.sort && this.sortBy() && this.sortType()) {
  //     this.sort.active = this.sortBy()!;
  //     this.sort.direction = this.sortType()!.toLowerCase() as 'asc' | 'desc';
  //     // this.sort.sortChange.emit({ active: this.sortBy()!, direction: this.sort.direction });
  //   }
  // }

  onMatSortChange(sort: Sort) {
    if (!sort.active || !sort.direction) return;
    this.sortChange.emit({
      sortBy: sort.active,
      sortType: sort.direction.toUpperCase() as 'ASC' | 'DESC',
    });
  }

  onStarClick(member: Member) {
    this.starClick.emit(member);
  }

  onWalletClick(member: Member) {
    this.walletClick.emit(member);
  }
}
