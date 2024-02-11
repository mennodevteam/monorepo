import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { RouterModule } from '@angular/router';
import { dashboardRoutes } from './dashboard.routes';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule, RouterModule.forChild(dashboardRoutes), SharedModule],
})
export class DashboardModule {}
