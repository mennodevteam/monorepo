import { Component } from '@angular/core';
import { Address, DELIVERY_COST_TITLE, DISCOUNT_CODE_TITLE, Member, OrderType, User } from '@menno/types';
import { PosService } from '../../../core/services/pos.service';
import { MatDialog } from '@angular/material/dialog';
import { TableSelectorDialogComponent } from '../../../shared/dialogs/table-selector-dialog/table-selector-dialog.component';
import { FormControl, FormGroup } from '@angular/forms';
import { ClubService } from '../../../core/services/club.service';
import { ShopService } from '../../../core/services/shop.service';
import { UserAddressesDialogComponent } from '../../../shared/dialogs/user-addresses-dialog/user-addresses-dialog.component';

@Component({
  selector: 'left-section',
  templateUrl: './left-section.component.html',
  styleUrls: ['./left-section.component.scss'],
})
export class LeftSectionComponent {
  User = User;
  userQueryForm = new FormGroup({
    query: new FormControl(''),
  });
  searchMembers: Member[];
  OrderType = OrderType;
  constructor(
    public POS: PosService,
    private dialog: MatDialog,
    private clubService: ClubService,
    private shopService: ShopService
  ) {}

  selectTable() {
    this.dialog
      .open(TableSelectorDialogComponent)
      .afterClosed()
      .subscribe((table: any) => {
        if (table) {
          this.POS.details = { ...(this.POS.details || {}), table: table.code };
        }
      });
  }

  get tables() {
    return this.shopService.shop?.details?.tables;
  }

  async searchMember() {
    this.searchMembers = [];
    const query = this.userQueryForm.getRawValue().query;
    if (query) {
      const members = await this.clubService
        .filter({
          query,
          take: 5,
        })
        .toPromise();

      if (members) {
        if (members[1] === 1) {
          this.selectMember(members[0][0]);
        } else {
          this.searchMembers = members[0];
        }
      }
    }
  }

  selectMember(member: Member) {
    this.POS.customer = member.user;
    this.searchMembers = [];
    this.userQueryForm.controls['query'].setValue('');
  }

  removeMember() {
    this.POS.customer = undefined;
  }

  get discountPrice() {
    return this.POS.abstractItems?.find((x) => x.title === DISCOUNT_CODE_TITLE)?.price || 0;
  }

  get deliveryPrice() {
    return this.POS.abstractItems?.find((x) => x.title === DELIVERY_COST_TITLE)?.price || 0;
  }

  selectCustomerAddress() {
    this.dialog
      .open(UserAddressesDialogComponent, {
        data: {
          user: this.POS.customer,
          addresses: this.POS.customerAddresses,
        },
      })
      .afterClosed()
      .subscribe((address: Address) => {
        if (address) this.POS.address = address;
      });
  }
}
