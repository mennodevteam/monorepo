import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { map } from 'rxjs';
import { DataService } from '../data.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'shop-home',
  templateUrl: './shop-home.component.html',
  styleUrls: ['./shop-home.component.scss'],
})
export class ShopHomeComponent {
  constructor(private data: DataService, private route: ActivatedRoute) {
    let query = location.hostname;
    if (environment.systemHostNames.indexOf(location.hostname) === -1)
      query = location.hostname;
    else {
      query = route.snapshot.params['code'];
    }

    this.data.load(query);
  }

  get shop() {
    return this.data.shop;
  }

  get phones() {
    return this.data.shop.pipe(map((x) => x?.phones.join(', ')));
  }
}
