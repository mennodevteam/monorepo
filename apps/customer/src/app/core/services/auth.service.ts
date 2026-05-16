import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { User } from '@menno/types';
import md5 from 'md5';
import { Guid } from 'guid-typescript';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private _loading = new BehaviorSubject<void>(undefined);
  user = signal<User | undefined>(undefined);

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    } else {
      this._loading.complete();
    }
  }

  async init() {
    const baleUserId = this.getBaleWebAppUserId();
    if (baleUserId) {
      try {
        const loggedIn = await lastValueFrom(this.http.post<User>(`/auth/login/bale`, { baleId: baleUserId }));
        if (loggedIn?.id && loggedIn.token) {
          this.user.set(loggedIn);
          this.saveLocal();
          this._loading.complete();
          try {
            (window as unknown as { Bale?: { WebApp?: { ready?: () => void } } }).Bale?.WebApp?.ready?.();
          } catch {
            /* ignore */
          }
          return;
        }
      } catch {
        /* not linked to Bale yet — fall through to guest / saved session */
      }
    }

    const _item = sessionStorage?.getItem('appLoginUser') || localStorage?.getItem('appLoginUser');
    if (_item) {
      try {
        const user = JSON.parse(_item);
        const info = await this.http.get<User>(`auth/info`).toPromise();
        if (info?.id === user.id) {
          this.user.set(info);
          this._loading.complete();
        }
      } catch (error) {
        // Ignore initialization errors
      }
    }

    if (!this.user()) {
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
    return this.http.post<User>(`auth/login/app`, { username, password }).pipe(
      map((user) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        this.user.set(user);
        this.saveLocal();
        this._loading.complete();
        return user;
      }),
    );
  }

  private saveLocal() {
    localStorage.setItem('appLoginUser', JSON.stringify(this.user()));
    sessionStorage.setItem('appLoginUser', JSON.stringify(this.user()));
  }

  sendToken(mobilePhone: string) {
    return this.http.get<void>('auth/sendToken/' + mobilePhone);
  }

  async loginWithToken(mobile: string, token: string, userDto?: User) {
    if (this.user()) {
      const user = await this.http
        .get<User | undefined>(`auth/login/app/${this.user()?.id}/${mobile}/${token}`)
        .toPromise();
      if (user) {
        this.user.set(user);
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
  }

  async getResolver() {
    if (this.user()) return this.user();
    return this._loading.asObservable().toPromise();
  }

  async update(dto: User) {
    const user = await this.http.put<User>(`auth/edit`, dto).toPromise();
    if (user) {
      const prevUser = sessionStorage.getItem('appLoginUser') || localStorage.getItem('appLoginUser');
      if (user && prevUser) {
        this.user.set({ ...JSON.parse(prevUser), ...dto });
        this.saveLocal();
      }
    }
  }

  readonly isGuestUser = computed(() => !this.user()?.mobilePhone);

  /** Bale mini app: `window.Bale.WebApp.initDataUnsafe.user.id` */
  private getBaleWebAppUserId(): string | undefined {
    try {
      const w = window as unknown as { Bale?: { WebApp?: { initDataUnsafe?: { user?: { id?: number } } } } };
      const id = w.Bale?.WebApp?.initDataUnsafe?.user?.id;
      if (id !== undefined && id !== null) return String(id);
    } catch {
      /* ignore */
    }
    return undefined;
  }

  // async openLoginPrompt(disableClose = false) {
  //   const complete = await this.bottomSheet
  //     .open(LoginBottomSheetComponent, {
  //       disableClose,
  //     })
  //     .afterDismissed()
  //     .toPromise();
  //   return complete;
  // }
}
