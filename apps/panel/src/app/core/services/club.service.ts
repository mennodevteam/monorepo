import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AdvancedPromptDialogComponent } from '../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { PersianNumberService } from '@menno/utils';
import {
  ClubConfig,
  DiscountCoupon,
  FilterMemberDto,
  FilterPurchasesDto,
  FilterSmsDto,
  GenderType,
  Member,
  MemberTag,
  Mission,
  NewSmsDto,
  Sms,
  SmsAccount,
  SmsGroup,
  User,
  Wallet,
} from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  private _tags = new BehaviorSubject<MemberTag[] | undefined>(undefined);
  private _smsAccount = new BehaviorSubject<SmsAccount | undefined>(undefined);
  private _memberCount = new BehaviorSubject<number | undefined>(undefined);

  constructor(
    private http: HttpClient,
    private shopService: ShopService,
    private snack: MatSnackBar,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.loadTags();
    this.loadSmsAccount();
    this.loadMemberCount();
    setInterval(() => {
      this.loadMemberCount();
      this.loadSmsAccount();
    }, 30000);
  }

  async loadMemberCount() {
    const members = await this.filter({ take: 1 }).toPromise();
    if (members) {
      this._memberCount.next(members[1]);
    }
  }

  config(): Observable<ClubConfig> {
    return this.http.get<ClubConfig>(`clubs/config`);
  }

  saveConfig(config: ClubConfig): Observable<ClubConfig> {
    return this.http.post<ClubConfig>(`clubs/config`, config);
  }

  filter(filter: FilterMemberDto): Observable<[Member[], number]> {
    return this.http.post<[Member[], number]>(`members/filter`, filter);
  }

  filterAnniversary(month: number, date: number): Observable<Member[]> {
    return this.http.get<Member[]>(`members/anniversary/${month}/${date}`);
  }

  getMemberByMobilePhone(mobile: string): Observable<Member> {
    return this.http.get<Member>(`members/${mobile}`);
  }

  async getMemberByUserId(userId: string): Promise<Member | undefined> {
    const m = await this.filter({ userId: userId }).toPromise();
    if (m) {
      return m[0][0];
    }
    return;
  }

  removeMemberTag(id: string) {
    return this.http.delete(`tags/${id}`);
  }

  removeMember(id: string) {
    return this.http.delete(`members/${id}`);
  }

  async insertMembers(members: Member[]): Promise<Member[]> {
    const res: Member[] = [];
    if (members.length > 1) {
      const m = await this.http.post<Member[]>('members/array', members).toPromise();
      if (!m) throw new Error();
      res.push(...m);
    } else {
      const m = await this.http.post<Member>('members', members[0]).toPromise();
      if (!m) throw new Error();
      res.push(m);
    }
    return res;
  }

  async editMember(member: Member): Promise<Member> {
    const res = await this.http.post<Member>('members', member).toPromise();
    if (!res) throw new Error();
    return res;
  }

  async editTag(tag: MemberTag): Promise<MemberTag> {
    const res = await this.http.post<MemberTag>('tags', tag).toPromise();
    if (!res) throw new Error();
    return res;
  }

  async loadTags(): Promise<MemberTag[]> {
    const res = await this.http.get<MemberTag[]>('tags').toPromise();
    this._tags.next(res);
    if (!res) throw new Error();
    return res;
  }

  async loadSmsAccount(): Promise<SmsAccount> {
    const res = await this.http.get<SmsAccount>('smsAccounts').toPromise();
    this._smsAccount.next(res);
    if (!res) throw new Error();
    return res;
  }

  async getMissions(): Promise<Mission[]> {
    const res = await this.http.get<Mission[]>('missions').toPromise();
    if (!res) throw new Error();
    return res;
  }

  async saveMission(mission: Mission): Promise<Mission> {
    const res = await this.http.post<Mission>('missions', mission).toPromise();
    if (!res) throw new Error();
    return res;
  }

  async getDiscountCoupons(userId?: string): Promise<DiscountCoupon[]> {
    let url = 'discountCoupons';
    if (userId) url += `/${userId}`;
    const res = await this.http.get<DiscountCoupon[]>(url).toPromise();
    if (!res) throw new Error();
    return res;
  }

  get memberCount(): Observable<number> {
    return new Observable((fn) => this._memberCount.subscribe(fn));
  }

  get tags(): Observable<MemberTag[]> {
    return new Observable((fn) => this._tags.subscribe(fn));
  }

  get smsAccount(): Observable<SmsAccount> {
    return new Observable((fn) => this._smsAccount.subscribe(fn));
  }

  get tagsValue(): MemberTag[] | undefined {
    return this._tags.value;
  }

  async sendSms(dto: NewSmsDto): Promise<SmsGroup | undefined> {
    const verify = await this.dialog
      .open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('verifySendSmsDialog.title'),
          description: this.translate.instant(
            dto.memberIds?.length === 1
              ? 'verifySendSmsDialog.description'
              : 'verifySendSmsDialog.allDescription'
          ),
          okText: this.translate.instant('verifySendSmsDialog.ok'),
        },
      })
      .afterClosed()
      .toPromise();
    if (!verify) return;
    const group = await this.http.post<SmsGroup>('sms/sendTemplate', dto).toPromise();
    this.snack
      .open(this.translate.instant('smsList.sentSuccess'), this.translate.instant('smsList.viewDetails'), {
        duration: 6000,
        panelClass: 'success',
      })
      .onAction()
      .subscribe(() => {
        this.router.navigate(['/club/sms/group']);
      });

    setTimeout(() => {
      this.loadSmsAccount();
    }, 5000);
    return group;
  }

  async filterSms(dto: FilterSmsDto): Promise<[SmsGroup[], number]> {
    const res = await this.http.post<[SmsGroup[], number]>('sms/filter', dto).toPromise();
    if (!res) throw new Error();
    return res;
  }

  async getSmsGroup(id: string): Promise<SmsGroup> {
    const res = await this.http.get<SmsGroup>('sms/group/'+id).toPromise();
    if (!res) throw new Error();
    return res;
  }

  async removeDiscountCoupon(discountCouponId: string): Promise<void> {
    await this.http.delete(`discountCoupons/${discountCouponId}`).toPromise();
  }

  async chargeWallet(member: Member, amount: number): Promise<void> {
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 0 });
    const wallet = await this.http
      .post<Wallet>(`wallets/charge`, { memberId: member.id, amount })
      .toPromise();
    if (wallet) {
      member.wallet = wallet;
      this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
    }
  }

  async saveDiscountCoupon(discountCoupon: Partial<DiscountCoupon>): Promise<DiscountCoupon> {
    const res = await this.http.post<DiscountCoupon>('discountCoupons', discountCoupon).toPromise();
    if (!res) throw new Error();
    return res;
  }

  async openAddMemberDialog(existMember?: Member): Promise<Member | undefined> {
    const dto = await this.dialog
      .open(AdvancedPromptDialogComponent, {
        width: '400px',
        disableClose: true,
        data: {
          title: this.translate.instant('addMemberDialog.newTitle'),
          fields: {
            firstName: {
              label: this.translate.instant('addMemberDialog.firstName'),
              control: new FormControl(existMember ? existMember.user.firstName : undefined, [
                Validators.required,
              ]),
            },
            lastName: {
              label: this.translate.instant('addMemberDialog.lastName'),
              control: new FormControl(existMember ? existMember.user.lastName : undefined),
            },
            gender: {
              label: this.translate.instant('addMemberDialog.gender'),
              options: [
                { text: this.translate.instant('addMemberDialog.maleGender'), value: GenderType.Male },
                { text: this.translate.instant('addMemberDialog.femaleGender'), value: GenderType.Female },
              ],
              type: 'select',
              control: new FormControl(existMember ? existMember.user.gender : GenderType.Male),
            },
            mobilePhone: {
              label: this.translate.instant('addMemberDialog.mobile'),
              control: new FormControl(existMember ? existMember.user.mobilePhone : undefined, [
                Validators.required,
                Validators.minLength(11),
                Validators.maxLength(11),
              ]),
              hint: this.translate.instant('addMemberDialog.mobileHint'),
              disabled: existMember != undefined,
            },
            birthDate: {
              label: this.translate.instant('addMemberDialog.birthDate'),
              type: 'datepicker',
              control: new FormControl(existMember ? existMember.user.birthDate : undefined),
            },
            marriageDate: {
              label: this.translate.instant('addMemberDialog.marriageDate'),
              type: 'datepicker',
              control: new FormControl(existMember ? existMember.user.marriageDate : undefined),
            },
            localPhone: {
              label: this.translate.instant('addMemberDialog.localPhone'),
              control: new FormControl(existMember ? existMember.user.localPhone : undefined),
            },
            instagram: {
              label: this.translate.instant('addMemberDialog.instagram'),
              control: new FormControl(existMember ? existMember.user.instagram : undefined),
            },
            address: {
              label: this.translate.instant('addMemberDialog.address'),
              control: new FormControl(existMember ? existMember.user.address : undefined),
            },
            job: {
              label: this.translate.instant('addMemberDialog.job'),
              control: new FormControl(existMember ? existMember.user.job : undefined),
            },
          },
        },
      })
      .afterClosed()
      .toPromise();
    if (dto) {
      const member = <Member>{
        id: existMember ? existMember.id : undefined,
        club: { id: this.shopService.shop?.club?.id },
        user: <User>{
          id: existMember ? existMember.user.id : undefined,
          firstName: dto.firstName,
          lastName: dto.lastName,
          mobilePhone: existMember ? undefined : this.generatePhoneString(dto.mobilePhone),
          localPhone: dto.localPhone ? PersianNumberService.toEnglish(dto.localPhone) : undefined,
          instagram: dto.instagram,
          birthDate: dto.birthDate ? dto.birthDate : undefined,
          marriageDate: dto.marriageDate ? dto.marriageDate : undefined,
          job: dto.job,
          gender: dto.gender,
          address: dto.address,
        },
      };

      if (existMember) {
        const editedMember = await this.editMember(member);
        this.snack.open(this.translate.instant('', { value: 1 }), '', {
          panelClass: 'success',
        });
        return editedMember;
      } else {
        const existPhoneFilter = await this.filter({ mobilePhone: member.user.mobilePhone }).toPromise();
        if (existPhoneFilter && existPhoneFilter[1] > 0) {
          this.snack.open(
            this.translate.instant('addMemberDialog.existPhoneError', {
              value: User.fullName(existPhoneFilter[0][0].user),
            }),
            '',
            { panelClass: 'warning' }
          );
          return;
        }

        const newMembers = await this.insertMembers([member]);
        this.snack.open(this.translate.instant('app.savedSuccessfully', { value: 1 }), '', {
          panelClass: 'success',
        });
        return newMembers[0];
      }
    }
    return;
  }

  private generatePhoneString(text: string) {
    text.replace(' ', '');
    if (text.length === 10 && text[0] === '9') {
      text = `0${text}`;
    }
    return PersianNumberService.toEnglish(text);
  }
}
