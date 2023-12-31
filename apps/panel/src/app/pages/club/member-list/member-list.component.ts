import { SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterMemberDto, GenderType, Member, MemberTag, NewSmsDto, SmsTemplate, User } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, map, merge, Observable, of } from 'rxjs';
import { ClubService } from '../../../core/services/club.service';
import { ShopService } from '../../../core/services/shop.service';
import * as XLSX from 'xlsx';
import { PersianNumberService } from '@menno/utils';
import { TagEditDialogComponent } from './tag-edit-dialog/tag-edit-dialog.component';
import { MessageTemplateSelectorDialogComponent } from '../../../shared/dialogs/message-template-selector-dialog/message-template-selector-dialog.component';
import { Sort } from '@angular/material/sort';

@Component({
  selector: 'member-list',
  templateUrl: './member-list.component.html',
  styleUrls: ['./member-list.component.scss'],
})
export class MemberListComponent {
  members = new BehaviorSubject<Member[]>([]);
  selectedMembers = new BehaviorSubject<Member[]>([]);
  memberData = new BehaviorSubject<[Member[], number]>([[], 0]);
  tags: MemberTag[] = [];
  filterForm: FormGroup;
  loading = false;
  totalCount: number;
  downloadingCSV = false;
  totalWalletCharge?: number;
  skipPaginatorChangeDetection = false;
  selection = new SelectionModel<Member>(true, []);
  sortBy: FilterMemberDto['sortBy'];
  sortType: FilterMemberDto['sortType'];
  private currentFilter?: FilterMemberDto;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public club: ClubService,
    public shop: ShopService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private route: ActivatedRoute
  ) {
    const params = this.route.snapshot.queryParams;
    this.filterForm = new FormGroup({
      query: new FormControl(params['query']),
      tagIds: new FormControl(
        params['tagIds'] ? params['tagIds'].split(',').map((x: string) => Number(x)) : []
      ),
    });

    this.selection.isSelected = (member) => {
      return this.selection.selected.find((x) => x.id == member.id) != undefined;
    };

    this.selection.changed.subscribe((selectionChange) => {
      this.selectedMembers.next(selectionChange.source.selected);
      if (selectionChange.added.length) {
        setTimeout(() => {
          if (this.selection.selected.length === 1 && selectionChange.added) {
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }
        }, 500);
      }
    });
  }

  ngAfterViewInit(): void {
    this.load();
    this.paginator.page.subscribe(() => {
      if (!this.skipPaginatorChangeDetection) this.load();
    });
  }

  load(clear?: boolean) {
    this.loading = true;
    if (clear) {
      this.skipPaginatorChangeDetection = true;
      this.paginator.firstPage();
      this.skipPaginatorChangeDetection = false;
    }
    this.currentFilter = this.clubFilter;
    this.club.filter(this.currentFilter).subscribe((res) => {
      this.totalCount = res[1];
      this.paginator.length = res[1];
      this.members.next(res[0]);
      this.selectedMembers.next(res[0]);
      this.memberData.next(res);
      this.loading = false;
    });

    this.totalWalletCharge = undefined;
    const noPaginationFilter = this.currentFilter;
    noPaginationFilter.take = undefined;
    noPaginationFilter.skip = undefined;
    this.club.filter(noPaginationFilter).subscribe((res) => {
      let sum = 0;
      for (const m of res[0]) {
        if (m.wallet)
          try {
            sum += m.wallet.charge;
          } catch (error) {}
      }
      this.totalWalletCharge = sum;
    });
  }

  removeFilter() {
    this.filterForm.reset();
    this.currentFilter = undefined;
    this.load();
  }

  async downloadCsv() {
    this.downloadingCSV = true;
    try {
      const data = await this.club.filter({}).toPromise();
      if (data) {
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          [
            'نام',
            'نام‌خانوادگی',
            'موبایل',
            'جنسیت',
            'آدرس',
            'تاریخ تولد',
            'تاریخ ازدواج',
            'اینستاگرام',
            'تاریخ عضویت',
            'تگ',
            'کلید',
            'ستاره',
            'اعتبار',
          ].join(',') +
          '\n' +
          data[0]
            .map((m) =>
              [
                m.user.firstName,
                m.user.lastName,
                m.user.mobilePhone,
                m.user.gender,
                m.user.address,
                m.user.birthDate,
                m.user.marriageDate,
                m.user.instagram,
                m.joinedAt,
                m.tags.map((x) => x.title).join('-'),
                m.publicKey,
                m.star,
                m.wallet?.charge || 0,
              ].join(',')
            )
            .join('\n');

        const encodedUri = encodeURI(csvContent);
        window.open(encodedUri);
      }
    } finally {
      this.downloadingCSV = false;
    }
  }

  get clubFilter() {
    const f = new FilterMemberDto();
    const formVal = this.filterForm.getRawValue();
    f.query = formVal.query;
    f.tagIds = formVal.tagIds;
    f.skip = (this.paginator.pageIndex || 0) * (this.paginator.pageSize || 20);
    f.take = this.paginator.pageSize || 20;
    f.sortBy = this.sortBy;
    f.sortType = this.sortType;
    return f;
  }

  async excelInputFileChanged(e: any) {
    const files = e.target.files,
      f = files[0];
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const data = new Uint8Array(e.target.result);
      const ws = XLSX.read(data, { type: 'array' });
      const sheet = ws.Sheets[ws.SheetNames[0]];
      const header: string[] = XLSX.utils.sheet_to_json(sheet, { range: 1, header: 'A' });
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { range: 1, header: 'A' });

      let members: Member[] = [];
      for (const d of json) {
        try {
          members.push(<Member>{
            club: { id: this.shop.shop?.club?.id },
            user: <User>{
              firstName: d.A ? d.A.trim() : undefined,
              lastName: d.B ? d.B.trim() : undefined,
              mobilePhone: d.C ? this.generatePhoneString(d.C.toString()) : undefined,
              gender: d.D
                ? d.D.toString() === '0'
                  ? GenderType.Male
                  : d.D.toString() === '1'
                  ? GenderType.Female
                  : undefined
                : undefined,
              birthDate: d.E ? new Date(d.E) : undefined,
              marriageDate: d.F ? new Date(d.F) : undefined,
              localPhone: d.G ? PersianNumberService.toEnglish(d.G.toString()) : undefined,
              instagram: d.H,
              job: d.I,
              address: d.J,
            },
          });
        } catch (error) {}
      }
      (members = members.filter((x) => x.user && x.user.firstName && x.user.mobilePhone)),
        this.club.insertMembers(members).then((res) => {
          this.snack.open(this.translate.instant('members.addedSuccessfully', { value: res.length }), '', {
            panelClass: 'success',
          });
          this.removeFilter();
        });
    };
    reader.readAsArrayBuffer(f);
  }

  async openAddMemberDialog() {
    this.club.openAddMemberDialog().then((member) => {
      if (member) {
        this.removeFilter();
      }
    });
  }

  private generatePhoneString(text: string) {
    text.replace(' ', '');
    if (text.length === 10 && text[0] === '9') {
      text = `0${text}`;
    }
    return PersianNumberService.toEnglish(text);
  }

  async sendSmsToAll() {
    const template: SmsTemplate = await this.dialog
      .open(MessageTemplateSelectorDialogComponent, {
        width: '960px',
      })
      .afterClosed()
      .toPromise();
    if (template) {
      const dto = new NewSmsDto();
      dto.templateId = template.id;
      this.club.sendSms(dto);
    }
  }

  async sendSelectedSms() {
    const template: SmsTemplate = await this.dialog
      .open(MessageTemplateSelectorDialogComponent, {
        width: '960px',
      })
      .afterClosed()
      .toPromise();
    if (template) {
      const dto = new NewSmsDto();
      dto.memberIds = this.selection.selected.map((x) => x.id);
      dto.templateId = template.id;
      this.club.sendSms(dto);
    }
  }

  async addSelectedTag(tag?: MemberTag) {
    if (!tag) {
      const dto: MemberTag = await this.dialog
        .open(TagEditDialogComponent, {
          data: {
            title: this.translate.instant('membersTable.addTag'),
            value: undefined,
            color: undefined,
          },
        })
        .afterClosed()
        .toPromise();

      if (dto) tag = await this.club.editTag(dto);
      else return;
      return;
    }

    for (const member of this.selection.selected) {
      if (member.tags.find((x) => x.id == tag?.id)) continue;
      const dto = new Member();
      dto.id = member.id;
      dto.tags = [...member.tags, tag];
      member.tags = (await this.club.editMember(dto)).tags;
    }
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
    this.club.loadTags();
  }

  sortChanged(ev: Sort) {
    if (!ev?.direction) {
      this.sortBy = undefined;
      this.sortType = undefined;
    } else {
      this.sortBy = ev.active as FilterMemberDto['sortBy'];
      this.sortType = ev.direction.toUpperCase() as FilterMemberDto['sortType'];
    }

    this.load();
  }
}
