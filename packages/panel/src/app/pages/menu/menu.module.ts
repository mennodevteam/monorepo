import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { menuRoutes } from './menu.routes';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { MenuToolbarComponent } from './menu-page/menu-toolbar/menu-toolbar.component';
import { SharedModule } from '../../shared/shared.module';
import { MenuCategoryContainerComponent } from './menu-page/menu-category-container/menu-category-container.component';

@NgModule({
  declarations: [MenuPageComponent, MenuToolbarComponent, MenuCategoryContainerComponent],
  imports: [CommonModule, RouterModule.forChild(menuRoutes), SharedModule],
})
export class MenuModule {}
