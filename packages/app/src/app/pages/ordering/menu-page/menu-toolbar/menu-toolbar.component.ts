import { Component } from '@angular/core';
import { DataService } from '../../data.service';

@Component({
  selector: 'menu-toolbar',
  templateUrl: './menu-toolbar.component.html',
  styleUrls: ['./menu-toolbar.component.scss'],
})
export class MenuToolbarComponent {
  constructor(private data: DataService) {}
  get shop() {
    return this.data.shop;
  }
}
