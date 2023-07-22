import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { Member } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  constructor(private http: HttpClient, private shopService: ShopService) {}

  async join() {
    if (this.shopService.shop?.club) {
      try {
        await this.http.get(`clubs/join/${this.shopService.shop.club.id}`).toPromise();
      } catch (error) {}
    }
  }

  async getMember() {
    if (this.shopService.shop?.club) {
      return this.http.get<Member>(`members/club/${this.shopService.shop.club.id}`).toPromise();
    }
    return undefined;
  }
}
