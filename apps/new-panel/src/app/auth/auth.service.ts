import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { User } from '@menno/types';
const JWT_KEY = 'jwtToken';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userInfo: User;
  private userLoaded: Promise<void>;
  private userLoadedResolver: () => void;

  constructor(private client: HttpClient) {
    this.userLoaded = new Promise((resolve) => {
      this.userLoadedResolver = resolve;
    });
    this.revalidateUserInfo();
  }

  async revalidateUserInfo() {
    const user = await lastValueFrom(this.client.get<User>(`/auth/info`));
    if (user) this.userInfo = user;
    this.userLoadedResolver();
  }

  async login(username: string, password: string) {
    const jwtToken = await this.client
      .post(
        `/auth/login/panel/v2`,
        {
          username,
          password,
        },
        {
          responseType: 'text',
        },
      )
      .toPromise();

    if (jwtToken) this.setToken(jwtToken);
    await this.revalidateUserInfo();
    return this.user;
  }

  private getToken = () => localStorage.getItem(JWT_KEY);

  private setToken = (token: string) => localStorage.setItem(JWT_KEY, token);

  private clearToken = () => localStorage.removeItem(JWT_KEY);

  get user() {
    try {
      const token = this.getToken();
      if (token) {
        const user: User = JSON.parse(atob(token.split('.')[1]));
        if (user && user.exp && user.exp * 1000 > Date.now()) return this.userInfo || user;
      }
    } catch (error) {
      // unhandled
    }
    this.clearToken();
    return null;
  }

  async complete(): Promise<void> {
    return this.userLoaded; // Wait for the user to be loaded
  }
}
