import { Component } from '@angular/core';
import { PosService } from '../../core/services/pos.service';

@Component({
  selector: 'pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
})
export class PosComponent {
  constructor(public POS: PosService) {
    this.POS.clear();
  }
}
