import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PosComponent } from './pos.component';
import { SharedModule } from '../../shared/shared.module';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { posRoutes } from './pos.routes';
import { MenuComponent } from './menu/menu.component';
import { BasketComponent } from './basket/basket.component';
import { MatDialogModule } from '@angular/material/dialog';
import { LeftSectionComponent } from './left-section/left-section.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [PosComponent, MenuComponent, BasketComponent, LeftSectionComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(posRoutes),
    FormsModule,
    SharedModule,
    MatTabsModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,
    MatListModule,
    MatButtonToggleModule,
    MatDialogModule,
  ],
})
export class PosModule {}
