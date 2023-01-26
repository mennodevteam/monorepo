import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@menno/types';
import * as md5 from 'md5';
import { Guid } from 'guid-typescript';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user = new BehaviorSubject<User | null>(null);

  constructor(private http: HttpClient) {
    const _item: any = sessionStorage?.getItem('appLoginUser') || localStorage?.getItem('appLoginUser');
    if (_item) {
      try {
        this._user = new BehaviorSubject<User | null>(JSON.parse(_item));
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

  async loginWithToken(mobile: string, token: string) {
    if (this.user) {
      const user = await this.http
        .get<User | undefined>(`auth/login/app/${this.user.id}/${mobile}/${token}`)
        .toPromise();
      if (user) {
        this._user.next(user);
        this.saveLocal();
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
    return this._user.asObservable();
  }

  async update(dto: User) {
    const user = await this.http.put<User>(`auth/edit`, dto).toPromise();
    if (user) {
      if (user) {
        localStorage.setItem('appLoginUser', JSON.stringify(user));
      }
      sessionStorage.setItem('appLoginUser', JSON.stringify(user));
      this._user.next(user);
    }
  }
}
