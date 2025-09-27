import { Component, EventEmitter, inject, input, output } from '@angular/core';
import { ShopUser, ShopUserRole, User } from '@menno/types';
import { AuthService } from '../../../../app/auth/auth.service';
import { TranslateModule } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

const IMPORTS = [
  TranslateModule,
  FlexLayoutModule,
  MatTableModule,
  MatChipsModule,
  MatButtonModule,
  MatIconModule,
];

@Component({
  selector: 'app-user-management-table',
  standalone: true,
  imports: IMPORTS,
  templateUrl: './user-management-table.component.html',
  styleUrl: './user-management-table.component.scss',
})
export class UserManagementTableComponent {
  readonly auth = inject(AuthService);

  readonly shopUsers = input.required<ShopUser[]>();
  readonly editEmit = output<ShopUser>();
  readonly removeEmit = output<ShopUser>();
  readonly onChange = output<void>();

  readonly ShopUserRole = ShopUserRole;
  readonly User = User;
  readonly displayedColumns = ['name', 'username', 'password', 'roleActions', 'actions'];

  getElementUser(element: any): any {
    return element.user;
  }

  getElementActions(element: any): any {
    return element.actions;
  }

  isCurrentUser(element: any): boolean {
    return this.auth.user?.id === this.getElementUser(element).id;
  }

  edit(item: ShopUser) {
    this.editEmit.emit(item);
  }

  removeShopUsers(item: ShopUser) {
    this.removeEmit.emit(item);
  }
}
