import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user: BehaviorSubject<User | null>;

  constructor(private http: HttpClient) {
    const _item: any =
      sessionStorage?.getItem('panelLoginUser') ||
      localStorage?.getItem('panelLoginUser');

    this._user = new BehaviorSubject<User | null>(JSON.parse(_item));
  }

  login(username: string, password: string, saveLoginUser?: boolean) {
    return this.http.post<any>(`auth/login`, { username, password }).pipe(
      map((user) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        if (saveLoginUser) {
          localStorage.setItem('panelLoginUser', JSON.stringify(user));
        }
        sessionStorage.setItem('panelLoginUser', JSON.stringify(user));
        this._user.next(user);
        return user;
      })
    );
  }

  sendToken(mobilePhone: string) {
    return this.http.get<any>('auth/sendToken/' + mobilePhone);
  }

  register(user: User) {
    return this.http.post<User>('auth/register', user);
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('panelLoginUser');
    sessionStorage.removeItem('panelLoginUser');
    this._user.next(null);
  }

  get user() {
    return new Observable((fn) => this._user.subscribe(fn));
  }

  get instantUser() {
    return this._user.value;
  }

  async update(dto: User) {
    const user = await this.http.put<User>(`auth/edit`, dto).toPromise();
    if (user) {
      if (user) {
        localStorage.setItem('panelLoginUser', JSON.stringify(user));
      }
      sessionStorage.setItem('panelLoginUser', JSON.stringify(user));
      this._user.next(user);
    }
  }
}
