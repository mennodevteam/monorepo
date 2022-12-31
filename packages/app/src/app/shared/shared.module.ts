import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GoBackDirective } from './directives/go-back.directive';
import { ImageLoaderDirective } from './directives/image-loader.directive';
import { MenuCurrencyPipe } from './pipes/menu-currency.pipe';

@NgModule({
  declarations: [GoBackDirective, ImageLoaderDirective, MenuCurrencyPipe],
  imports: [CommonModule],
  exports: [GoBackDirective, ImageLoaderDirective, MenuCurrencyPipe],
  providers: [DecimalPipe]
})
export class SharedModule {}
