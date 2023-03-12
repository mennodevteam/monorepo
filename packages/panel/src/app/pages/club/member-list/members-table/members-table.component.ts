import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { Member, MemberTag, SmsTemplate, User } from '@menno/types';
import { ShopService } from 'packages/panel/src/app/core/services/shop.service';
import { ClubService } from 'packages/panel/src/app/core/services/club.service';
import { MemberDialogComponent } from 'packages/panel/src/app/shared/dialogs/member-dialog/member-dialog.component';

@Component({
  selector: 'clb-members-table',
  templateUrl: './members-table.component.html',
  styleUrls: ['./members-table.component.scss'],
})
export class MembersTableComponent implements OnInit {
  User = User;
  @Input() members: BehaviorSubject<Member[]>;
  @Input() selection: SelectionModel<Member>;
  dataSource = new MatTableDataSource<Member>([]);

  displayedColumns = ['select', 'name', 'phone', 'wallet', 'joinedAt', 'star', 'tags'];
  constructor(
    public shop: ShopService,
    private club: ClubService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    if (this.members.value) {
      this.setDataSource(this.members.value);
    }

    this.members.subscribe((data) => this.setDataSource(data));
  }

  setDataSource(data: Member[]) {
    this.dataSource.data = data || [];
    // this.selection.clear();
  }

  memberNewTagList(member: Member): MemberTag[] {
    const currentTags = member.tags.map((x) => x.id);
    const tags = this.club.tagsValue;
    return tags ? tags.filter((t) => currentTags.indexOf(t.id) === -1) : [];
  }

  memberAddTag(member: Member, tag: MemberTag) {
    const dto = new Member();
    dto.id = member.id;
    dto.tags = [...member.tags, tag];
    this.club.editMember(dto).then((savedMember: Member) => {
      member.tags = savedMember.tags;
      this.club.loadTags();
    });
  }

  memberRemoveTag(member: Member, tag: MemberTag) {
    const dto = new Member();
    dto.id = member.id;
    dto.tags = [...member.tags];
    dto.tags.splice(dto.tags.indexOf(tag), 1);
    this.club.editMember(dto).then((savedMember: Member) => {
      member.tags = savedMember.tags;
      this.club.loadTags();
    });
  }

  async memberEditTag(member: Member, tag?: MemberTag) {
    // const dto: MemberTag = await this.dialog
    //   .open(TagEditDialogComponent, {
    //     data: {
    //       title: tag
    //         ? this.translate.instant('membersTable.editTag')
    //         : this.translate.instant('membersTable.addTag'),
    //       value: tag ? tag.title : undefined,
    //       color: tag ? tag.color : undefined,
    //     },
    //   })
    //   .afterClosed()
    //   .toPromise();
    // if (dto) {
    //   if (tag) {
    //     dto.id = tag.id;
    //     const editedTag = await this.club.editTag(dto);
    //     const members = await this.members.pipe(take(1)).toPromise() || [];
    //     for (const m of members) {
    //       const memberTagIndex = m.tags.findIndex((x) => x.id === editedTag.id);
    //       if (memberTagIndex > -1) {
    //         m.tags[memberTagIndex] = editedTag;
    //       }
    //     }
    //     this.club.loadTags();
    //   } else {
    //     await this.memberAddTag(member, dto);
    //     this.club.loadTags();
    //   }
    // }
  }

  async openSmsDialog(member: Member) {
    // const template: SmsTemplate = await this.dialog
    //   .open(MessageTemplateSelectorDialogComponent, {
    //     width: '960px',
    //   })
    //   .afterClosed()
    //   .toPromise();
    // if (template) {
    //   const dto = new NewSmsDto();
    //   dto.receptors = [member.user.mobilePhone];
    //   dto.templateId = template.id;
    //   this.club.sendSms(dto);
    // }
  }

  clickMember(member: Member) {
    if (member.user && member.user.mobilePhone) {
      this.dialog.open(MemberDialogComponent, {
        data: { mobilePhone: member.user.mobilePhone },
      });
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    return this.dataSource.data.some((x) => !this.selection.selected.find((y) => x.id == y.id))
      ? false
      : true;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }
}
