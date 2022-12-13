import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { FileService } from './file.service';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root'
})
export class SupportChatService {

  constructor(
    private auth: AuthService,
    private shopService: ShopService,
    private file: FileService,
  ) {
    this.shopService.shop.subscribe(async (shop) => {
      setTimeout(async () => {
        const raychat = await this.raychat;
        raychat.setUser({
          email: shop.username,
          name: shop.title,
          about: `شهر: ${shop.region.title}`,
          phone: shop.phones ? shop.phones.join(' - ') : '',
          avatar: this.file.getFileUrl(shop.logo),
          updateOnce: false,
        });
      }, 5000);
    })
  }

  async open() {
    const raychat = await this.raychat;
    raychat.open();
  }

  get raychat(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (window['Raychat']) resolve(window['Raychat']);
      window.addEventListener('raychat_ready', function (ets) {
        resolve(window['Raychat']);
      });
    })
  }

  get isEnabled() {
    return window['Raychat'] != undefined;
  }
}
