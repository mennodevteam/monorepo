import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@menno/types';
import * as md5 from 'md5';
import { Guid } from 'guid-typescript';
import { LoginBottomSheetComponent } from '../../shared/dialogs/login-bottom-sheet/login-bottom-sheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient, private bottomSheet: MatBottomSheet) {
    this.init();
  }

  async init() {
    const _item: any = sessionStorage?.getItem('appLoginUser') || localStorage?.getItem('appLoginUser');
    if (_item) {
      try {
        const user = JSON.parse(_item);
        const info = await this.http.get<User>(`auth/info`).toPromise();
        if (info?.id === user.id) {
          this._user.next(user);
        }
      } catch (error) {}
    }

    if (!this.user) {
      this.generateUser();
    }
  }

  async generateUser(): Promise<User | undefined> {
    const id = Guid.create().toString();
    const reverseId = id.split('').reverse().join();
    const hash: string = md5(reverseId).toString();
    return this.register(id, hash).toPromise();
  }

  register(username: string, password: string) {
    return this.http.post<any>(`auth/login/app`, { username, password }).pipe(
      map((user) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        this._user.next(user);
        this.saveLocal();
        return user;
      })
    );
  }

  private saveLocal() {
    localStorage.setItem('appLoginUser', JSON.stringify(this.user));
    sessionStorage.setItem('appLoginUser', JSON.stringify(this.user));
  }

  sendToken(mobilePhone: string) {
    return this.http.get<any>('auth/sendToken/' + mobilePhone);
  }

  async loginWithToken(mobile: string, token: string, userDto?: User) {
    if (this.user) {
      const user = await this.http
        .get<User | undefined>(`auth/login/app/${this.user.id}/${mobile}/${token}`)
        .toPromise();
      if (user) {
        this._user.next(user);
        this.saveLocal();
        if (userDto) {
          await this.update(userDto);
          user.firstName = userDto.firstName;
          user.lastName = userDto.lastName;
        }
        return user;
      }
    }

    return undefined;
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('appLoginUser');
    sessionStorage.removeItem('appLoginUser');
    this._user.next(null);
  }

  get user() {
    return this._user.value;
  }

  get userObservable() {
    if (this.user) return of(this.user);
    return this._user.asObservable();
  }

  async update(dto: User) {
    const user = await this.http.put<User>(`auth/edit`, dto).toPromise();
    if (user) {
      const prevUser = sessionStorage.getItem('appLoginUser') || localStorage.getItem('appLoginUser');
      if (user && prevUser) {
        this._user.next({ ...JSON.parse(prevUser), ...user });
        this.saveLocal();
      }
    }
  }

  get isGuestUser() {
    return !this.user?.mobilePhone;
  }

  async openLoginPrompt(disableClose = false) {
    const complete = await this.bottomSheet
      .open(LoginBottomSheetComponent, {
        disableClose,
      })
      .afterDismissed()
      .toPromise();
    return complete;
  }
}
