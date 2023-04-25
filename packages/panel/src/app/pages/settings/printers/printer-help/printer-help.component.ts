import { Component } from '@angular/core';
import { PrinterService } from 'packages/panel/src/app/core/services/printer.service';
import { ShopService } from 'packages/panel/src/app/core/services/shop.service';
import { environment } from 'packages/panel/src/environments/environment';

@Component({
  selector: 'printer-help',
  templateUrl: './printer-help.component.html',
  styleUrls: ['./printer-help.component.scss'],
})
export class PrinterHelpComponent {
  env = environment;
  constructor(public PS: PrinterService, private shopService: ShopService) {}

  get shop() {
    return this.shopService.shop;
  }

  copyId() {
    navigator.clipboard.writeText(this.shop!.id);
  }
}
