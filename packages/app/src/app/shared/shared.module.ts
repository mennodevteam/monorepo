import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GoBackDirective } from './directives/go-back.directive';
import { ImageLoaderDirective } from './directives/image-loader.directive';
import { MenuCurrencyPipe } from './pipes/menu-currency.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { CountSelectorComponent } from './components/count-selector/count-selector.component';
import { MatButtonModule } from '@angular/material/button';
import { LoginBottomSheetComponent } from './dialogs/login-bottom-sheet/login-bottom-sheet.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  declarations: [
    GoBackDirective,
    ImageLoaderDirective,
    MenuCurrencyPipe,
    CountSelectorComponent,
    LoginBottomSheetComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  exports: [GoBackDirective, ImageLoaderDirective, MenuCurrencyPipe, TranslateModule, CountSelectorComponent],
  providers: [DecimalPipe],
})
export class SharedModule {}
