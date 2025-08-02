import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ShopService } from '../../shop/shop.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from './dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { Address, FilterMemberDto, GenderType, Member, User, Mission, Status } from '@menno/types';
import { lastValueFrom } from 'rxjs';
import { PromptFields } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { PersianNumberService } from '@menno/utils';

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  private readonly http = inject(HttpClient);
  private readonly shop = inject(ShopService);
  private readonly translate = inject(TranslateService);
  private readonly dialog = inject(DialogService);
  private readonly snack = inject(MatSnackBar);
  private readonly queryClient = inject(QueryClient);
  
  saveMemberMutation = injectMutation(() => ({
    mutationFn: (member: Member) => lastValueFrom(this.http.post<Member>(`/members`, member)),
    onMutate: () => {
      this.snack.open(this.translate.instant('app.saving'), '', { duration: 4000 });
    },
    onSuccess: () => {
      this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { duration: 2000 });
      this.queryClient.invalidateQueries({ queryKey: ['memberList'] });
    },
    onError: () => {
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));

  saveAddressMutation = injectMutation(() => ({
    mutationFn: (address: Address) => lastValueFrom(this.http.post<Address>(`/addresses`, address)),
    onMutate: () => {
      this.snack.open(this.translate.instant('app.saving'), '', { duration: 4000 });
    },
    onSuccess: () => {
      this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { duration: 2000 });
    },
    onError: () => {
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));

  async editMemberDialog(member?: Member) {
    const fields: PromptFields = {
      firstName: {
        label: this.translate.instant('addMemberDialog.firstName'),
        control: new FormControl(member?.user?.firstName, [Validators.required]),
      },
      lastName: {
        label: this.translate.instant('addMemberDialog.lastName'),
        control: new FormControl(member?.user?.lastName),
      },
      gender: {
        label: this.translate.instant('addMemberDialog.gender'),
        options: [
          { text: this.translate.instant('addMemberDialog.maleGender'), value: GenderType.Male },
          { text: this.translate.instant('addMemberDialog.femaleGender'), value: GenderType.Female },
        ],
        type: 'select',
        control: new FormControl(
          member?.user?.gender != undefined ? member?.user?.gender : GenderType.Female,
        ),
      },
      mobilePhone: {
        label: this.translate.instant('addMemberDialog.mobile'),
        control: new FormControl(member?.user?.mobilePhone, [
          Validators.required,
          Validators.minLength(11),
          Validators.maxLength(11),
        ]),
        hint: this.translate.instant('addMemberDialog.mobileHint'),
        disabled: !!member,
      },
    };

    const user = await this.dialog.prompt(
      this.translate.instant(member ? 'addMemberDialog.editTitle' : 'addMemberDialog.newTitle'),
      fields,
      {
        config: {
          disableClose: true,
        },
      },
    );
    if (user) {
      user.mobilePhone = PersianNumberService.toEnglish(user.mobilePhone);
      if (!member) {
        const existPhoneFilter = await this.http
          .post<[Member[], number]>('/members/filter', {
            mobilePhone: user.mobilePhone,
            take: 1,
          } as FilterMemberDto)
          .toPromise();
        if (existPhoneFilter && existPhoneFilter[1] > 0) {
          this.snack.open(
            this.translate.instant('addMemberDialog.existPhoneError', {
              value: User.fullName(existPhoneFilter[0][0].user),
            }),
            '',
            { panelClass: 'warning' },
          );
          return;
        }
      }

      const dto: any = {
        id: member?.id,
        club: { id: this.shop.data()?.club?.id },
        user,
      };

      const savedMember = await this.saveMemberMutation.mutateAsync(dto);
      return savedMember;
    }
    return;
  }

  // Mission-related methods
  saveMissionMutation = injectMutation(() => ({
    mutationFn: (mission: Mission) => lastValueFrom(this.http.post<Mission>(`/missions`, mission)),
    onMutate: () => {
      this.snack.open(this.translate.instant('app.saving'), '', { duration: 4000 });
    },
    onSuccess: () => {
      this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { duration: 2000 });
      this.queryClient.invalidateQueries({ queryKey: ['missionList'] });
    },
    onError: () => {
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));

  deleteMissionMutation = injectMutation(() => ({
    mutationFn: (id: number) => lastValueFrom(this.http.delete(`/missions/${id}`)),
    onSuccess: () => {
      this.snack.open(this.translate.instant('app.deletedSuccessfully'), '', { duration: 2000 });
      this.queryClient.invalidateQueries({ queryKey: ['missionList'] });
    },
    onError: () => {
      this.snack.open(this.translate.instant('errors.deleteError'), '', { duration: 2000 });
    },
  }));
}
