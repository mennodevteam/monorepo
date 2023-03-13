import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Member, NewSmsDto, Order, OrderType, SmsTemplate, User } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ClubService } from '../../../core/services/club.service';
import { OrdersService } from '../../../core/services/orders.service';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { MessageTemplateSelectorDialogComponent } from '../message-template-selector-dialog/message-template-selector-dialog.component';
import { PromptDialogComponent } from '../prompt-dialog/prompt-dialog.component';

@Component({
  selector: 'app-member-dialog',
  templateUrl: './member-dialog.component.html',
  styleUrls: ['./member-dialog.component.scss'],
})
export class MemberDialogComponent implements OnInit {
  member: Member;
  orders: Order[];
  OrderType = OrderType;
  User = User;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<any>,
    private dialog: MatDialog,
    private club: ClubService,
    public orderService: OrdersService,
    private router: Router,
    private translate: TranslateService,
    // private userActions: UserActionsService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.club.getMemberByMobilePhone(this.data.mobilePhone).subscribe((member) => {
      if (member) {
        this.member = member;

        this.orderService.filter({ customerId: this.member.user.id }).then((orders) => {
          if (orders) this.orders = orders;
        });
      } else {
        this.snack.open(this.translate.instant('memberDialog.notMemberWarning'), '', {
          panelClass: 'warning',
        });
        this.dialogRef.close();
      }
    });
  }

  async openSmsDialog() {
    const template: SmsTemplate = await this.dialog
      .open(MessageTemplateSelectorDialogComponent, {
        width: '960px',
      })
      .afterClosed()
      .toPromise();

    if (template) {
      const dto = new NewSmsDto();
      dto.receptors = [this.member.user.mobilePhone];
      dto.templateId = template.id;
      this.club.sendSms(dto);
      this.dialogRef.close();
    }
  }

  async publicKeyClick() {
    if (this.member.publicKey) {
      const ok = await this.dialog
        .open(AlertDialogComponent, {
          width: '500px',
          data: {
            title: this.translate.instant('memberDialog.publicKey'),
            description: this.translate.instant('memberDialog.publicKeyExistDialogDescription', {
              value: this.member.publicKey,
            }),
          },
        })
        .afterClosed()
        .toPromise();
      if (!ok) return;
    }

    const publicKey: string = await this.dialog
      .open(PromptDialogComponent, {
        width: '500px',
        data: {
          title: this.translate.instant('memberDialog.publicKey'),
          description: this.translate.instant('memberDialog.publicKeyDialogDescription'),
          label: this.translate.instant('memberDialog.publicKeyDialogLabel'),
        },
      })
      .afterClosed()
      .toPromise();

    if (publicKey) {
      const dto = new Member();
      dto.id = this.member.id;
      dto.publicKey = publicKey;
      await this.club.editMember(dto);
      this.snack
        .open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' })
        .onAction()
        .subscribe(() => {
          this.router.navigate(['/messages/list']);
        });
      this.dialogRef.close();
    }
  }

  orderClick(order: Order) {
    this.router.navigate(['/orders', order.id]);
    this.dialogRef.close();
  }

  async chargeWallet() {
    const charge: number = await this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('memberDialog.chargeDialogTitle'),
          description: this.translate.instant('memberDialog.chargeDialogDescription'),
          label: this.translate.instant('memberDialog.chargeDialogLabel'),
          type: 'number',
        },
      })
      .afterClosed()
      .toPromise();
    if (charge && charge > 0) {
      this.club.chargeWallet(this.member, Number(charge));
    }
  }

  async edit() {
    const member = await this.club.openAddMemberDialog(this.member);
    if (member) {
      this.load();
    }
  }

  get canChargeWallet() {
    return true;
    // return this.userActions.hasAction(UserAction.ChargeMemberWallet);
  }

  async editStar() {
    const star = await this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('memberDialog.editStar'),
          description: this.translate.instant('memberDialog.editStarDescription'),
          label: this.translate.instant('memberDialog.editStarLabel'),
          type: 'number',
          value: this.member.star,
        },
      })
      .afterClosed()
      .toPromise();

    if (star >= 0 && star <= 5) {
      this.club
        .editMember(<Member>{
          id: this.member.id,
          star,
        })
        .then((res) => {
          this.member.star = res.star;
        });
    }
  }

  removeMember() {
    this.dialog
      .open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('memberDialog.removeMember'),
          description: this.translate.instant('memberDialog.removeMemberDescription'),
        },
      })
      .afterClosed()
      .subscribe(async (res) => {
        if (res) {
          await this.club.removeMember(this.member.id).toPromise();
          this.snack.open(this.translate.instant('memberDialog.removedSuccessfully'), '', {
            panelClass: 'success',
          });
          this.dialogRef.close();
        }
      });
  }
}
