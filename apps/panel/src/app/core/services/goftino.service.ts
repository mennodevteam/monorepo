import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { FilesService } from './files.service';
import { Shop } from '@menno/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class GoftinoService {
  constructor(private shopsService: ShopService, private filesService: FilesService, private auth: AuthService) {
    this.shopsService.shopObservable.subscribe((shop) => {
      if (shop) {
        if (this.Goftino) this.setUser(shop);
        else {
          window.addEventListener('goftino_ready', () => {
            this.setUser(shop)
          });
        }
      }
    });
  }

  private setUser(shop: Shop) {
    const user = {
      name: shop.title,
      phone: shop.phones.join(', ') + `, ${this.auth.instantUser?.mobilePhone}`,
      avatar: this.filesService.getFileUrl(shop.logo),
      forceUpdate: true,
    }
    this.Goftino.setUser(user);
    this.Goftino.setUserId(shop.id);
  }

  get Goftino(): any {
    return window['Goftino' as any];
  }
}
