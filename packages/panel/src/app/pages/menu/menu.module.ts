import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuComponent } from './menu.component';
import { RouterModule } from '@angular/router';
import { menuRoutes } from './menu.routes';

@NgModule({
  declarations: [MenuComponent],
  imports: [CommonModule, RouterModule.forChild(menuRoutes)],
})
export class MenuModule {}
