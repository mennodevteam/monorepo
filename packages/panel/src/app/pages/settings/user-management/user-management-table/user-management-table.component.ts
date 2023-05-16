import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Pipe,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShopUser, ShopUserRole, User } from '@menno/types';
import { AuthService } from 'packages/panel/src/app/core/services/auth.service';

@Component({
  selector: 'app-user-management-table',
  templateUrl: './user-management-table.component.html',
  styleUrls: ['./user-management-table.component.scss'],
})
export class UserManagementTableComponent implements OnInit {
  @Input() shopUsers: ShopUser[];
  @Output() editEmit = new EventEmitter<ShopUser>();
  @Output() removeEmit = new EventEmitter<ShopUser>();
  @Output() onChange = new EventEmitter();
  ShopUserRole = ShopUserRole;
  User = User;

  displayedColumns = ['name', 'username', 'mobile', 'roleActions', 'actions'];
  constructor(
    public auth: AuthService,
  ) { }

  ngOnInit(): void { }

  edit(item: ShopUser) {
    this.editEmit.emit(item);
  }

  removeShopUsers(item: ShopUser) {
    this.removeEmit.emit(item);
  }
}
