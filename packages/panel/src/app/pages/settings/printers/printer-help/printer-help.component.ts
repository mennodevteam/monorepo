import { Component } from '@angular/core';
import { PrinterService } from 'packages/panel/src/app/core/services/printer.service';
import { environment } from 'packages/panel/src/environments/environment';

@Component({
  selector: 'printer-help',
  templateUrl: './printer-help.component.html',
  styleUrls: ['./printer-help.component.scss'],
})
export class PrinterHelpComponent {
  env = environment;
  constructor(public PS: PrinterService){}
}
