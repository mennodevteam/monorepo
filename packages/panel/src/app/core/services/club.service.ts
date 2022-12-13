import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Member } from '@menno/types';
import { BehaviorSubject, Observable } from 'rxjs';
import { FilterMemberDto } from '@menno/types';
import { NewSmsDto } from '@menno/types';
import { Sms } from '@menno/types';
import { MemberTag } from '@menno/types';
import { HttpClient } from '@angular/common/http';
import { Mission } from '@menno/types';
import { DiscountCoupon } from '@menno/types';
import { Purchase } from '@menno/types';
import { FilterPurchasesDto } from '@menno/types';
import { FilterSmsDto } from '@menno/types';
import { SmsAccount } from '@menno/types';
import { AdvancedPromptDialogComponent } from '../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { User } from '@menno/types';
import { GenderType } from '@menno/types';
import { OrderConfig } from '@menno/types';
import { ClubConfig } from '@menno/types';
import { Wallet } from '@menno/types';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { PersianNumberService } from '@menno/utils'

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  private _tags: BehaviorSubject<MemberTag[]> = new BehaviorSubject(undefined);
  private _smsAccount: BehaviorSubject<SmsAccount> = new BehaviorSubject(undefined);
  private _memberCount: BehaviorSubject<number> = new BehaviorSubject(undefined);

  constructor(
    private http: HttpClient,
    private shop: ShopService,
    private snack: MatSnackBar,
    private translate: TranslateService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.loadTags();
    this.loadSmsAccount().then(() => {
      if (this._smsAccount.value && this._smsAccount.value.charge < 10000) {
        this.dialog.open(AlertDialogComponent, {
          data: {
            title: this.translate.instant('smsAccountCharge.chargeCreditDialogTitle'),
            description: this._smsAccount.value.charge <= 0 ? this.translate.instant('smsAccountCharge.chargeCreditDialogNoDescription') : this.translate.instant('smsAccountCharge.chargeCreditDialogDescription'),
            hideCancel: true,
            okText: this.translate.instant('app.close'),
          }
        })
      }
    });
    this.loadMemberCount();
    setInterval(() => {
      this.loadMemberCount();
      this.loadSmsAccount();
    }, 30000);
  }

  async loadMemberCount() {
    const members = await this.filter({take: 1}).toPromise();
    this._memberCount.next(members[1]);
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

  async getMemberByUserId(userId: string): Promise<Member> {
    const m = await this.filter({ userId: userId }).toPromise();
    return m[0][0];
  }

  removeMemberTag(id: string) {
    return this.http.delete(`tags/${id}`);
  }

  removeMember(id: string) {
    return this.http.delete(`members/${id}`);
  }

  insertMembers(members: Member[]): Promise<Member[]> {
    return this.http.post<Member[]>('members/array', members).toPromise();
  }

  editMember(member: Member): Promise<Member> {
    return this.http.post<Member>('members', member).toPromise();
  }

  editTag(tag: MemberTag): Promise<MemberTag> {
    return this.http.post<MemberTag>('tags', tag).toPromise();
  }

  async loadTags(): Promise<MemberTag[]> {
    const tags = await this.http.get<MemberTag[]>('tags').toPromise();
    this._tags.next(tags);
    return tags;
  }

  async loadSmsAccount(): Promise<SmsAccount> {
    const account = await this.http.get<SmsAccount>('smsAccount').toPromise();
    this._smsAccount.next(account);
    return account;
  }

  getMissions(): Promise<Mission[]> {
    return this.http.get<Mission[]>('missions').toPromise();
  }

  saveMission(mission: Mission): Promise<Mission> {
    return this.http.post<Mission>('missions', mission).toPromise();
  }

  getDiscountCoupons(memberId?: string): Promise<DiscountCoupon[]> {
    let url = 'discountCoupons';
    if (memberId) url += `/${memberId}`;
    return this.http.get<DiscountCoupon[]>(url).toPromise();
  }

  filterPurchases(dto: FilterPurchasesDto): Promise<Purchase[]> {
    return this.http.post<Purchase[]>('purchases/filter', dto).toPromise();
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

  get tagsValue(): MemberTag[] {
    return this._tags.value;
  }

  async sendSms(dto: NewSmsDto): Promise<Sms[]> {
    const sms = await this.http.post<Sms[]>('sms', dto).toPromise();
    this.snack
      .open(
        this.translate.instant('smsTable.successfullySent'),
        this.translate.instant('smsTable.viewResult'),
        {
          duration: 6000,
          panelClass: 'success',
        }
      )
      .onAction()
      .subscribe(() => {
        this.router.navigate(['/reports/list/messages']);
      });

    setTimeout(() => {
      this.loadSmsAccount();
    }, 5000);
    return sms;
  }

  filterSms(dto: FilterSmsDto): Promise<[Sms[], number]> {
    return this.http.post<[Sms[], number]>('sms/filter', dto).toPromise();
  }

  async removeDiscountCoupon(discountCouponId: string): Promise<void> {
    await this.http.delete(`discountCoupons/${discountCouponId}`).toPromise();
  }

  async chargeWallet(member: Member, amount: number): Promise<void> {
    this.snack.open(this.translate.instant('app.saving'), '', { duration: 0 });
    const wallet = await this.http.post<Wallet>(`wallets/charge`, { memberId: member.id, amount }).toPromise();
    member.wallet = wallet;
    this.snack.open(this.translate.instant('app.changedSuccessfully'), '', { panelClass: 'success' });

  }

  saveDiscountCoupon(discountCoupon: DiscountCoupon): Promise<DiscountCoupon> {
    return this.http
      .post<DiscountCoupon>('discountCoupons', discountCoupon)
      .toPromise();
  }

  async openAddMemberDialog(existMember?: Member): Promise<Member> {
    const dto = await this.dialog.open(AdvancedPromptDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: this.translate.instant('addMemberDialog.newTitle'),
        fields: {
          firstName: {
            label: this.translate.instant('addMemberDialog.firstName'),
            control: new FormControl(existMember ? existMember.user.firstName : undefined, [Validators.required]),
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
            control: new FormControl(existMember ? existMember.user.mobilePhone : undefined, [Validators.required, Validators.minLength(11), Validators.maxLength(11)]),
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
      }
    }).afterClosed().toPromise();
    if (dto) {
      const member = <Member>{
        id: existMember ? existMember.id : undefined,
        club: { id: this.shop.instant.clubId },
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
          address: dto.address
        },
      }

      if (existMember) {
        const editedMember = await this.editMember(member);
        this.snack.open(this.translate.instant('app.changedSuccessfully', { value: 1 }), '', {
          panelClass: 'success',
        })
        return editedMember;
      } else {
        const existPhoneFilter = await this.filter({ mobilePhone: member.user.mobilePhone }).toPromise();
        if (existPhoneFilter[1] > 0) {
          this.snack.open(this.translate.instant('addMemberDialog.existPhoneError', {
            value: User.fullName(existPhoneFilter[0][0].user)
          }), '', { panelClass: 'warning' });
          return;
        }
  
        const newMembers = await this.insertMembers([member]);
        newMembers[0].user = member.user;
        member.user.id = newMembers[0].userId;
        this.snack.open(this.translate.instant('members.addedSuccessfully', { value: 1 }), '', {
          panelClass: 'success',
        })
        return newMembers[0];
      }
    }
  }

  private generatePhoneString(text: string) {
    text.replace(' ', '');
    if (text.length === 10 && text[0] === '9') {
      text = `0${text}`;
    }
    return PersianNumberService.toEnglish(text);
  }
}
