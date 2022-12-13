import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ShopUser, UserAction } from '@menno/types';
import { ShopUserRole } from '@menno/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserActionsService {
  private _user = new BehaviorSubject<ShopUser>(undefined);
  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {
    this.http.get('shopUsers').subscribe((users: ShopUser[]) => {
      this._user.next(users.find(x => x.userId === this.auth.instantUser.id));
    })
  }

  get instantActions() {
    return this._user.value.actions;
  }

  get instantRole() {
    return this._user.value.role;
  }

  get actions(): Observable<UserAction[]> {
    return new Observable((fn) => this._user.pipe(filter(x => x != undefined)).pipe(map(x => x.actions)).subscribe(fn));
  }

  get role(): Observable<ShopUserRole> {
    return new Observable((fn) => this._user.pipe(filter(x => x != undefined)).pipe(map(x => x.role)).subscribe(fn));
  }

  hasAction(action: UserAction): boolean {
    try {
      return this._user.value.role === ShopUserRole.Admin || this.instantActions.indexOf(action) > -1;
    } catch (error) {
      return false;
    }
  }
}
