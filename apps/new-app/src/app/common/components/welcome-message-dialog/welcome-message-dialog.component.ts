import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { AppConfig } from '@menno/types';
import { COMMON } from '../../../common';
import { ShopService } from '../../../core';

@Component({
  selector: 'app-welcome-message-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, COMMON],
  templateUrl: './welcome-message-dialog.component.html',
  styleUrl: './welcome-message-dialog.component.scss',
})
export class WelcomeMessageDialogComponent {
  shopService = inject(ShopService);
  shop = this.shopService.shop;
  appConfig = this.shop.appConfig;
}
