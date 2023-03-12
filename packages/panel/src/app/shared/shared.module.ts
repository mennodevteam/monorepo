import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { LayoutModule } from '@angular/cdk/layout';
import { TranslateModule } from '@ngx-translate/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter, MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { PromptDialogComponent } from './dialogs/prompt-dialog/prompt-dialog.component';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdvancedPromptDialogComponent } from './dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { GoBackDirective } from './directives/go-back.directive';
import { SanitizeUrlPipe } from './pipes/sanitize-url.pipe';
import { PdatePipe } from './pipes/pdate.pipe';
import { SelectDialogComponent } from './dialogs/select-dialog/select-dialog.component';
import { AlertDialogComponent } from './dialogs/alert-dialog/alert-dialog.component';
import { MenuCurrencyPipe } from './pipes/menu-currency.pipe';
import { ImageCropperDialogComponent } from './dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ImageLoaderDirective } from './directives/image-loader.directive';
import { FormBuilderComponent } from './components/form-builder/form-builder.component';
import { MaterialPersianDateAdapter, PERSIAN_DATE_FORMATS } from '../core/material.persian-date.adapter';
import { OrdersTableComponent } from './components/orders-table/orders-table.component';
import { OrderTypePipe } from './pipes/order-type.pipe';
import { OrderStatePipe } from './pipes/order-state.pipe';
import { OrderPaymentPipe } from './pipes/order-payment.pipe';
import { ManualDiscountAndCostDialogComponent } from './dialogs/manual-discount-and-cost-dialog/manual-discount-and-cost-dialog.component';
import { SettlementDialogComponent } from './dialogs/settlement-dialog/settlement-dialog.component';
import { MemberSelectDialogComponent } from './dialogs/member-select-dialog/member-select-dialog.component';
import { PhonePipe } from './pipes/phone.pipe';
import { StopPropagationDirective } from './directives/stop-propagation.directive';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { RouterLink } from '@angular/router';
import { MemberDialogComponent } from './dialogs/member-dialog/member-dialog.component';

@NgModule({
  declarations: [
    PromptDialogComponent,
    AdvancedPromptDialogComponent,
    ImageCropperDialogComponent,
    GoBackDirective,
    SanitizeUrlPipe,
    MenuCurrencyPipe,
    PdatePipe,
    PhonePipe,
    SelectDialogComponent,
    AlertDialogComponent,
    ImageLoaderDirective,
    FormBuilderComponent,
    OrdersTableComponent,
    OrderTypePipe,
    OrderStatePipe,
    OrderPaymentPipe,
    StopPropagationDirective,
    ManualDiscountAndCostDialogComponent,
    MemberDialogComponent,
    MemberSelectDialogComponent,
    SettlementDialogComponent,
    PhonePipe,
    EmptyStateComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ReactiveFormsModule,
    LayoutModule,
    ImageCropperModule,
    TranslateModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatCardModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatInputModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatSnackBarModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCheckboxModule,
    MatGridListModule,
    MatTooltipModule,
    MatChipsModule,
    MatRadioModule,
  ],
  exports: [
    AdvancedPromptDialogComponent,
    ImageCropperDialogComponent,
    GoBackDirective,
    SanitizeUrlPipe,
    MenuCurrencyPipe,
    OrderTypePipe,
    OrderStatePipe,
    OrderPaymentPipe,
    StopPropagationDirective,
    PdatePipe,
    PhonePipe,
    EmptyStateComponent,
    AlertDialogComponent,
    SelectDialogComponent,
    ManualDiscountAndCostDialogComponent,
    MemberDialogComponent,
    MemberSelectDialogComponent,
    SettlementDialogComponent,
    TranslateModule,
    ImageLoaderDirective,
    FormBuilderComponent,
    OrdersTableComponent,

    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    MatCardModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatSlideToggleModule,
    MatInputModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatGridListModule,
    MatTooltipModule,
    MatChipsModule,
    MatRadioModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: MaterialPersianDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: PERSIAN_DATE_FORMATS },
    DatePipe,
    DecimalPipe,
  ],
})
export class SharedModule {}
