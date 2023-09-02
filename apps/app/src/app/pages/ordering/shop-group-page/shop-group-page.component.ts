import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Shop, ShopGroup } from '@menno/types';
import { ShopService } from '../../../core/services/shop.service';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'shop-group-page',
  templateUrl: './shop-group-page.component.html',
  styleUrls: ['./shop-group-page.component.scss'],
})
export class ShopGroupPageComponent {
  shopGroup: ShopGroup;
  appLink = (shop: Shop) => Shop.appLink(shop, environment.appDomain);
  constructor(private http: HttpClient, private shopService: ShopService, private router: Router) {
    const query = this.shopService.getShopUsernameFromQuery();
    this.http.get<ShopGroup>(`shopGroups/${query}`).subscribe(
      (data) => {
        if (data) this.shopGroup = data;
        else {
          this.router.navigateByUrl(`/`, { replaceUrl: true });
        }
      },
      (error) => {
        this.router.navigateByUrl(`/`, { replaceUrl: true });
      }
    );
  }
}
