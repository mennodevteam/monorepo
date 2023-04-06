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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PdatePipe } from './pipes/pdate.pipe';
import { OrderTypePipe } from './pipes/order-type.pipe';

@NgModule({
  declarations: [
    GoBackDirective,
    ImageLoaderDirective,
    MenuCurrencyPipe,
    CountSelectorComponent,
    LoginBottomSheetComponent,
    PdatePipe,
    OrderTypePipe,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatAutocompleteModule,
  ],
  exports: [
    GoBackDirective,
    PdatePipe,
    OrderTypePipe,
    ImageLoaderDirective,
    MenuCurrencyPipe,
    TranslateModule,
    CountSelectorComponent,
    MatAutocompleteModule,
  ],
  providers: [DecimalPipe],
})
export class SharedModule {}
