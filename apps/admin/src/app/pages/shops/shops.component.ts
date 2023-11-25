import { ChangeDetectorRef, Component } from '@angular/core';
import { ShopsService } from '../../core/services/shops.service';
import { Plugin, Shop, User } from '@menno/types';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../environments/environment';
import { Sort } from '@angular/material/sort';

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
    'createdAt',
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

  sortChanged(ev: Sort) {
    if (this.shops) {
      switch (ev.active) {
        case 'code':
          this.dataSource = new MatTableDataSource(
            this.shops.sort((a, b) => (Number(a.code) - Number(b.code)) * (ev.direction === 'desc' ? -1 : 1))
          );
          break;
        case 'createdAt':
          this.dataSource = new MatTableDataSource(
            this.shops.sort(
              (a, b) =>
                (new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf()) *
                (ev.direction === 'desc' ? -1 : 1)
            )
          );
          break;
        case 'connectionAt':
          this.dataSource = new MatTableDataSource(
            this.shops.sort(
              (a, b) =>
                (new Date(a.connectionAt).valueOf() - new Date(b.connectionAt).valueOf()) *
                (ev.direction === 'desc' ? -1 : 1)
            )
          );
          break;
        case 'expiredAt':
          this.dataSource = new MatTableDataSource(
            this.shops.sort(
              (a, b) =>
                (new Date(a.plugins?.expiredAt || 0).valueOf() -
                  new Date(b.plugins?.expiredAt || 0).valueOf()) *
                (ev.direction === 'desc' ? -1 : 1)
            )
          );
          break;
        default:
          break;
      }
    }
  }
}
