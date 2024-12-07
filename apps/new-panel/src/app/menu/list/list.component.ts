import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MenuService } from '../menu.service';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MenuCategoryComponent } from './category/category.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, SHARED, MatListModule, MatCardModule, MenuCategoryComponent, MatToolbarModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class MenuListComponent {
  menuService = inject(MenuService);
}
