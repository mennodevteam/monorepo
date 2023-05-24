import { ChangeDetectorRef, Component } from '@angular/core';
import { ShopsService } from '../../core/services/shops.service';
import { Plugin, Shop } from '@menno/types';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'menno-shops',
  templateUrl: './shops.component.html',
  styleUrls: ['./shops.component.scss'],
})
export class ShopsComponent {
  dataSource = new MatTableDataSource<Shop>();
  columns = ['code', 'image', 'title', 'plugins', 'expiredAt', 'username', 'password', 'connectionAt'];
  Plugin = Plugin;

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
}
