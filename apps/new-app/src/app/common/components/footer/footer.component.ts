import { Component, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../..';
import { ShopService } from '../../../core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, COMMON],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly shopService = inject(ShopService);
  readonly enamad = model(this.shopService.shop.details.enamadInnerHtml);
}
