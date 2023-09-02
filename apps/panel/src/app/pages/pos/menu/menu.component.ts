import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component } from '@angular/core';
import { Product, ProductCategory } from '@menno/types';
import { map, Observable, shareReplay } from 'rxjs';
import { MenuService } from '../../../core/services/menu.service';
import { PosService } from '../../../core/services/pos.service';

@Component({
  selector: 'menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  Product = Product;
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );
  isXSmall$: Observable<boolean> = this.breakpointObserver.observe([Breakpoints.XSmall]).pipe(
    map((result) => result.matches),
    shareReplay()
  );

  constructor(private breakpointObserver: BreakpointObserver, public POS: PosService) {
  }

}
