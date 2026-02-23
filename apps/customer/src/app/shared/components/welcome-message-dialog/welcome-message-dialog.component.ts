import { Component, computed, inject } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ShopService } from '../../../core/services/shop.service';
import { ImageLoaderDirective } from '../../directives';

@Component({
  selector: 'app-welcome-message-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, ImageLoaderDirective],
  templateUrl: './welcome-message-dialog.component.html',
  styleUrl: './welcome-message-dialog.component.scss',
})
export class WelcomeMessageDialogComponent {
  private readonly shopService = inject(ShopService);
  readonly shop = this.shopService.data;
  readonly welcomeMessage = computed(() => this.shop()?.appConfig?.welcomeMessage);
}
