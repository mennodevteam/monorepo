import { ChangeDetectorRef, Component } from '@angular/core';
import { ShopsService } from '../../core/services/shops.service';
import { Plugin, Shop, User } from '@menno/types';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'menno-shops',
  templateUrl: './shops.component.html',
  styleUrls: ['./shops.component.scss'],
})
export class ShopsComponent {
  dataSource = new MatTableDataSource<Shop>();
  columns = [
    'index',
    'image',
    'code',
    'id',
    'title',
    'plugins',
    'expiredAt',
    'manager',
    'username',
    'password',
    'connectionAt',
    'actions',
  ];
  Plugin = Plugin;
  Shop = Shop;
  User = User;
  now = new Date();

  constructor(public shopsService: ShopsService, private cdr: ChangeDetectorRef) {
    if (this.shops) {
      this.dataSource = new MatTableDataSource(this.shops);
      // this.cdr.detectChanges();
    }
    this.shopsService.shopsObservable.subscribe((shops) => {
      if (shops) this.dataSource = new MatTableDataSource(shops);
    });
  }

  get shops() {
    return this.shopsService.shops;
  }

  get panelLink() {
    return environment.panelLoginLink;
  }

  get origin() {
    return environment.appOrigin;
  }
}
