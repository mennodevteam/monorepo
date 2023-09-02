import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { GoBackDirective } from './directives/go-back.directive';
import { ImageLoaderDirective } from './directives/image-loader.directive';
import { MenuCurrencyPipe } from './pipes/menu-currency.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { CountSelectorComponent } from './components/count-selector/count-selector.component';
import { MatButtonModule } from '@angular/material/button';
import { LoginBottomSheetComponent } from './dialogs/login-bottom-sheet/login-bottom-sheet.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PdatePipe } from './pipes/pdate.pipe';
import { OrderTypePipe } from './pipes/order-type.pipe';
import { PromptDialogComponent } from './dialogs/prompt-dialog/prompt-dialog.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';

@NgModule({
  declarations: [
    GoBackDirective,
    ImageLoaderDirective,
    EmptyStateComponent,
    MenuCurrencyPipe,
    CountSelectorComponent,
    LoginBottomSheetComponent,
    PromptDialogComponent,
    PdatePipe,
    OrderTypePipe,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatIconModule,
  ],
  exports: [
    GoBackDirective,
    PdatePipe,
    OrderTypePipe,
    ImageLoaderDirective,
    EmptyStateComponent,
    MenuCurrencyPipe,
    TranslateModule,
    CountSelectorComponent,
    MatAutocompleteModule,
    MatIconModule,
  ],
  providers: [DecimalPipe],
})
export class SharedModule {}
