import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberListComponent } from './member-list/member-list.component';
import { ClubComponent } from './club.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { clubRoutes } from './club.routes';
import { MembersTableComponent } from './member-list/members-table/members-table.component';
import { TagEditDialogComponent } from './member-list/tag-edit-dialog/tag-edit-dialog.component';

@NgModule({
  declarations: [MemberListComponent, ClubComponent, TagEditDialogComponent, MembersTableComponent],
  imports: [CommonModule, SharedModule, RouterModule.forChild(clubRoutes)],
})
export class ClubModule {}
