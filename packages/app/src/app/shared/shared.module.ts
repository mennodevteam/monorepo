import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GoBackDirective } from './directives/go-back.directive';
import { ImageLoaderDirective } from './directives/image-loader.directive';
import { MenuCurrencyPipe } from './pipes/menu-currency.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { CountSelectorComponent } from './components/count-selector/count-selector.component';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [GoBackDirective, ImageLoaderDirective, MenuCurrencyPipe, CountSelectorComponent],
  imports: [CommonModule, TranslateModule, MatButtonModule],
  exports: [
    GoBackDirective,
    ImageLoaderDirective,
    MenuCurrencyPipe,
    TranslateModule,
    CountSelectorComponent,
  ],
  providers: [DecimalPipe],
})
export class SharedModule {}
