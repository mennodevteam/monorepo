import { Component, inject, computed } from '@angular/core';

import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ShopService } from '../shop/shop.service';
import { PlanCardComponent } from './plan-card/plan-card.component';
import { WalletCardComponent } from './wallet-card/wallet-card.component';
import { OrderTotalComponent } from './order-total/order-total.component';
import { AuthService } from '../auth/auth.service';
import { UserAction } from '@menno/types';
import { MenuService } from '../menu/menu.service';
import { MatCardModule } from '@angular/material/card';
import { DialogService } from '../core/services/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl, Validators } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { MaterialsService } from '../inventory/materials.service';
import { getHomeTips } from './tips.constants';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    PlanCardComponent,
    WalletCardComponent,
    OrderTotalComponent,
    MatCardModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly shopService = inject(ShopService);
  readonly auth = inject(AuthService);
  readonly menuService = inject(MenuService);
  readonly materialsService = inject(MaterialsService);
  readonly dialog = inject(DialogService);
  private readonly snack = inject(MatSnackBar);
  readonly UserAction = UserAction;

  private readonly randomIndex = Math.floor(Math.random() * 100);

  readonly randomMessage = computed(() => {
    const user = this.auth.userSignal();
    const name = user?.firstName || 'همکار';

    const messages = getHomeTips(name);
    return messages[this.randomIndex % messages.length];
  });

  readonly totalProductCount = computed(() => {
    const cats = this.menuService.categories();
    if (!cats) return 0;
    return cats.reduce((sum, cat) => sum + (cat.products?.length || 0), 0);
  });

  // Flag signals for highlighting/badges in the quick actions cards
  readonly noLogo = computed(() => !this.shopService.data()?.logoImage);
  readonly noCategories = computed(() => {
    const cats = this.menuService.categories();
    return !cats || cats.length === 0;
  });
  readonly lowProducts = computed(() => this.totalProductCount() < 3);
  readonly noMaterials = computed(() => {
    const m = this.materialsService.materialsQuery.data();
    return !m || m.length === 0;
  });
  readonly noBoms = computed(() => {
    const b = this.materialsService.bomsQuery.data();
    return !b || b.length === 0;
  });

  // Recommended tab based on status
  readonly recommendedTab = computed(() => {
    if (this.noLogo() || this.noCategories() || this.lowProducts()) {
      return 'setup';
    }
    if (this.noMaterials() || this.noBoms()) {
      return 'accounting';
    }
    return 'marketing';
  });

  activeTabOverride?: string;

  get currentActiveTab(): string {
    return this.activeTabOverride ?? this.recommendedTab();
  }

  selectTab(tab: string) {
    this.activeTabOverride = tab;
  }

  async sendLink() {
    const dto = await this.dialog.prompt(
      'ارسال لینک وب‌سایت به مشتری',
      {
        mobile: {
          label: 'تلفن همراه',
          control: new FormControl('', [Validators.required, Validators.pattern(/^09\d{9}$/)]),
          placeholder: 'مثال: 09351234567',
        },
      },
      {
        description: 'شماره تلفن همراه مشتری را وارد کنید تا پیامک حاوی لینک وب‌سایت برای ایشان ارسال شود.',
      }
    );

    if (dto && dto.mobile) {
      try {
        await lastValueFrom(this.shopService.http.get<void>(`/shops/sendLink/${dto.mobile}`));
        this.snack.open('لینک وب‌سایت با موفقیت ارسال شد.', '', { duration: 2000 });
      } catch (err) {
        this.snack.open('خطا در ارسال پیامک. لطفاً دوباره تلاش کنید.', '', { duration: 2000 });
      }
    }
  }
}


