import { Component } from '@angular/core';
import { PrinterService } from '../../../core/services/printer.service';

@Component({
  selector: 'printers',
  templateUrl: './printers.component.html',
  styleUrls: ['./printers.component.scss'],
})
export class PrintersComponent {
  constructor(public PS: PrinterService){}
}
