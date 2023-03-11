import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FilterMemberDto, Member, User } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
import { ClubService } from '../../../core/services/club.service';
import { ImagePlaceholder } from '../../directives/image-loader.directive';

@Component({
  selector: 'app-member-select-dialog',
  templateUrl: './member-select-dialog.component.html',
  styleUrls: ['./member-select-dialog.component.scss']
})
export class MemberSelectDialogComponent implements OnInit {
  query: string;
  ImagePlaceholder = ImagePlaceholder;
  filteredMembers = new BehaviorSubject<Member[] | undefined>(undefined);
  User = User;
  searchingUser = false;
  @ViewChild('queryInput') queryInput: ElementRef;

  constructor(
    private club: ClubService,
    private dialogRef: MatDialogRef<any>,
    private dialog: MatDialog,
  ) { }

  ngOnInit() {
  }

  searchUser(): void {
    if (this.query) {
      this.searchingUser = true;
      this.club.filter(<FilterMemberDto>{
        take: 10,
        query: this.query,
      }).subscribe((response) => {
        this.filteredMembers.next(response[0]);
        this.searchingUser = false;
      });
    }
  }

  selectMember(member: Member) {
    this.dialogRef.close(member);
  }

  displayFn(member: Member): string | undefined {
    if (member) {
      return User.fullName(member.user);
    }
    return;
  }

  async newMember() {
    const newMember = await this.club.openAddMemberDialog();
    this.searchingUser = true;
    if (newMember) {
      this.dialogRef.close(newMember);
    }
  }
}
