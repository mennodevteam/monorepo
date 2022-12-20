import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@menno/types';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _user: BehaviorSubject<User | null>;

  constructor(private http: HttpClient) {
    const _item: any =
      sessionStorage?.getItem(environment.localStorageUserKey) ||
      localStorage?.getItem(environment.localStorageUserKey);

    this._user = new BehaviorSubject<User | null>(JSON.parse(_item));
  }

  login(username: string, password: string, saveLoginUser?: boolean) {
    return this.http.post<any>(`auth/login/panel`, { username, password }).pipe(
      map((user) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        if (saveLoginUser) {
          localStorage.setItem(environment.localStorageUserKey, JSON.stringify(user));
        }
        sessionStorage.setItem(environment.localStorageUserKey, JSON.stringify(user));
        this._user.next(user);
        return user;
      })
    );
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem(environment.localStorageUserKey);
    sessionStorage.removeItem(environment.localStorageUserKey);
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
        localStorage.setItem(environment.localStorageUserKey, JSON.stringify(user));
      }
      sessionStorage.setItem(environment.localStorageUserKey, JSON.stringify(user));
      this._user.next(user);
    }
  }
}
