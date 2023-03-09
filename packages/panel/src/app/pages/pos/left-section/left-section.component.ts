import { Component } from '@angular/core';
import { OrderType } from '@menno/types';
import { PosService } from '../../../core/services/pos.service';

@Component({
  selector: 'left-section',
  templateUrl: './left-section.component.html',
  styleUrls: ['./left-section.component.scss'],
})
export class LeftSectionComponent {
  OrderType = OrderType;
  constructor(public POS: PosService) {}
}
