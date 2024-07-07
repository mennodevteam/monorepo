import { AfterViewInit, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../../common';
import { Shop } from '@menno/types';

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [CommonModule, COMMON],
  templateUrl: './slider.component.html',
  styleUrl: './slider.component.scss',
})
export class SliderComponent implements AfterViewInit {
  @Input() shop: Shop;
  @Input() test: number;
  constructor() {}

  ngAfterViewInit(): void {
    console.log(this.shop);
    console.log(this.test);
  }
}
