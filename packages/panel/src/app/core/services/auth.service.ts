import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@menno/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _user: BehaviorSubject<User>;

  constructor(private http: HttpClient) {
    this._user = new BehaviorSubject<User>(JSON.parse(sessionStorage.getItem('panelLoginUser') || localStorage.getItem('panelLoginUser')));
  }

  init(username: string) {
    return this.http.get<User>('auth/init/' + username);
  }

  sendSmsToken(mobile: string) {
    return this.http.get('auth/sendToken/' + mobile);
  }

  changePassword(dto: any) {
    return this.http.post('auth/changePassword', dto).toPromise();
  }

  login(username: string, password: string, saveLoginUser?: boolean) {
    return this.http.post<any>(`auth/login`, { username, password })
      .pipe(map(user => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        if (saveLoginUser) {
          localStorage.setItem('panelLoginUser', JSON.stringify(user));
        }
        sessionStorage.setItem('panelLoginUser', JSON.stringify(user));
        this._user.next(user);
        return user;
      }));
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('panelLoginUser');
    sessionStorage.removeItem('panelLoginUser');
    this._user.next(null);
  }

  get user(): Observable<User> {
    return new Observable(fn => this._user.subscribe(fn));
  }

  get instantUser() {
    return this._user.value;
  }
}
