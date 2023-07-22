import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { Member } from '@menno/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  constructor(private http: HttpClient, private shopService: ShopService, private auth: AuthService) {}

  async join() {
    if (this.auth.isGuestUser) {
      const u = await this.auth.openLoginPrompt();
      if (!u) return;
    }
    if (this.shopService.shop?.club) {
      try {
        return await this.http.get<Member>(`clubs/join/${this.shopService.shop.club.id}`).toPromise();
      } catch (error) {}
    }
    return;
  }

  async getMember() {
    if (this.shopService.shop?.club) {
      return this.http.get<Member>(`members/club/${this.shopService.shop.club.id}`).toPromise();
    }
    return undefined;
  }
}
