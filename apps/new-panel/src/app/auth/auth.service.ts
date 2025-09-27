import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { User, ShopUser, UserAction, ShopUserRole } from '@menno/types';
const JWT_KEY = 'jwtToken';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userInfo: User;
  private shopUserInfo: ShopUser | null = null;
  private userLoaded: Promise<void>;
  private userLoadedResolver: () => void;
  userSignal = signal<User | null>(null);

  constructor(private client: HttpClient) {
    this.userLoaded = new Promise((resolve) => {
      this.userLoadedResolver = resolve;
    });
    this.revalidateUserInfo();
  }

  async revalidateUserInfo() {
    try {
      if (!this.getToken()) return;
      const user = await lastValueFrom(this.client.get<User>(`/auth/info`));
      if (user) this.userInfo = user;
      this.userSignal.set(user);
      
      // Load shop user info if user is authenticated
      if (user) {
        await this.loadShopUserInfo();
      }
      
      this.userLoadedResolver();
    } catch (error: any) {
      if (error.status === HttpStatusCode.NotFound || error.status === HttpStatusCode.Forbidden) {
        this.logout();
      }
    }
  }

  private async loadShopUserInfo() {
    try {
      this.shopUserInfo = await lastValueFrom(this.client.get<ShopUser>(`/shopUsers/info`));
    } catch (error: any) {
      // If shop user info fails to load, it might not be available
      this.shopUserInfo = null;
    }
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

  async getShopUserResolver(): Promise<ShopUser | null> {
    if (this.shopUserInfo) return this.shopUserInfo;
    
    // If shop user info is not loaded, try to load it
    await this.loadShopUserInfo();
    return this.shopUserInfo;
  }

  get actions(): UserAction[] {
    return this.shopUserInfo?.actions || [];
  }

  hasAccess(action: UserAction): boolean {
    return this.actions.indexOf(action) > -1 || this.shopUserInfo?.role === ShopUserRole.Admin;
  }

  logout() {
    this.clearToken();
    this.userSignal.set(null);
    this.shopUserInfo = null;
  }
}
