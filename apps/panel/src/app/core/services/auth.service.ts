import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChangePasswordDto, ShopUser, ShopUserRole, User, UserAction } from '@menno/types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user$: BehaviorSubject<User | null>;
  shopUser: ShopUser;

  constructor(private http: HttpClient) {
    const _item: any =
      sessionStorage?.getItem(environment.localStorageUserKey) ||
      localStorage?.getItem(environment.localStorageUserKey);

    if (_item) {
      this.user$ = new BehaviorSubject<User | null>(JSON.parse(_item));
      this.loadShopUser();
    } else {
      this.user$ = new BehaviorSubject<User | null>(null);
    }

    this.user$.subscribe((u) => {
      this.loadShopUser();
    });
  }

  login(username: string, password: string, saveLoginUser?: boolean) {
    return this.http.post<any>(`auth/login/panel`, { username, password }).pipe(
      map((user) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        if (saveLoginUser) {
          localStorage.setItem(environment.localStorageUserKey, JSON.stringify(user));
        }
        sessionStorage.setItem(environment.localStorageUserKey, JSON.stringify(user));
        this.user$.next(user);
        return user;
      }),
    );
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem(environment.localStorageUserKey);
    sessionStorage.removeItem(environment.localStorageUserKey);
    this.user$.next(null);
  }

  get user() {
    return new Observable((fn) => this.user$.subscribe(fn));
  }

  get instantUser() {
    return this.user$.value;
  }

  async update(dto: User) {
    const user = await this.http.put<User>(`auth/edit`, dto).toPromise();
    if (user) {
      if (user) {
        localStorage.setItem(environment.localStorageUserKey, JSON.stringify(user));
      }
      sessionStorage.setItem(environment.localStorageUserKey, JSON.stringify(user));
      this.user$.next(user);
    }
  }

  changePassword(dto: ChangePasswordDto) {
    return this.http.post<void>(`auth/changePassword`, dto).toPromise();
  }

  private async loadShopUser() {
    const s = await this.http.get<ShopUser>('shopUsers/info').toPromise();
    if (s) this.shopUser = s;
  }

  get actions() {
    return this.shopUser?.actions || [];
  }

  hasAccess(action: UserAction) {
    return this.actions.indexOf(action) > -1 || this.shopUser?.role === ShopUserRole.Admin;
  }
}
