import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GoBackDirective } from './directives/go-back.directive';
import { ImageLoaderDirective } from './directives/image-loader.directive';
import { MenuCurrencyPipe } from './pipes/menu-currency.pipe';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [GoBackDirective, ImageLoaderDirective, MenuCurrencyPipe],
  imports: [CommonModule, TranslateModule],
  exports: [GoBackDirective, ImageLoaderDirective, MenuCurrencyPipe, TranslateModule],
  providers: [DecimalPipe],
})
export class SharedModule {}
