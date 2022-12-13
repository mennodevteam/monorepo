import { NgModule } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRippleModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { LayoutModule } from '@angular/cdk/layout';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GoBackDirective } from './directives/go-back.directive';
import { MenuCurrencyPipe } from './pipes/menu-currency.pipe';
import { AlertDialogComponent } from './dialogs/alert-dialog/alert-dialog.component';
import { PromptDialogComponent } from './dialogs/prompt-dialog/prompt-dialog.component';
import { AdvancedPromptDialogComponent } from './dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { PdatePipe } from './pipes/pdate.pipe';
import { ProgressDialogComponent } from './dialogs/progress-dialog/progress-dialog.component';
import { ImageCropperDialogComponent } from './dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ImageSelectorButtonComponent } from './components/image-selector-button/image-selector-button.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FileImageDirective } from './directives/file-image.directive';
import { ExcelUploadDialogComponent } from './dialogs/excel-upload-dialog/excel-upload-dialog.component';
import { NgChartsModule } from 'ng2-charts';
import { DiscountCouponPipe } from './pipes/discount-coupon.pipe';
import { SortDialogComponent } from './dialogs/sort-dialog/sort-dialog.component';
import { OrderDialogComponent } from './dialogs/order-dialog/order-dialog.component';
import { MessageTemplateSelectorDialogComponent } from './dialogs/message-template-selector-dialog/message-template-selector-dialog.component';
import { MemberAutocompleteComponent } from './components/member-autocomplete/member-autocomplete.component';
import { MemberDialogComponent } from './dialogs/member-dialog/member-dialog.component';
import { StopPropagationDirective } from './directives/stop-propagation.directive';
import { MemberSelectDialogComponent } from './dialogs/member-select-dialog/member-select-dialog.component';
import { TableSelectorDialogComponent } from './dialogs/table-selector-dialog/table-selector-dialog.component';
import { ConcatArrayPipe } from './pipes/concat-array.pipe';
import { OrderTypesDialogComponent } from './dialogs/order-types-dialog/order-types-dialog.component';
import { UpdateDialogComponent } from './dialogs/update-dialog/update-dialog.component';
import { OrderStatesDialogComponent } from './dialogs/order-states-dialog/order-states-dialog.component';

@NgModule({
  declarations: [
    GoBackDirective,
    MenuCurrencyPipe,
    AlertDialogComponent,
    PromptDialogComponent,
    AdvancedPromptDialogComponent,
    OrderTypesDialogComponent,
    PdatePipe,
    ConcatArrayPipe,
    ProgressDialogComponent,
    ImageCropperDialogComponent,
    ImageSelectorButtonComponent,
    FileImageDirective,
    ExcelUploadDialogComponent,
    DiscountCouponPipe,
    SortDialogComponent,
    OrderDialogComponent,
    MessageTemplateSelectorDialogComponent,
    MemberAutocompleteComponent,
    MemberDialogComponent,
    StopPropagationDirective,
    MemberSelectDialogComponent,
    TableSelectorDialogComponent,
    UpdateDialogComponent,
    OrderStatesDialogComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    ImageCropperModule,
    NgChartsModule,
    MatRippleModule,
    MatDividerModule,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDialogModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatListModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatSidenavModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    LayoutModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    MatExpansionModule,
    MatStepperModule,
  ],
  exports: [
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    GoBackDirective,
    MenuCurrencyPipe,
    PdatePipe,
    ConcatArrayPipe,
    AlertDialogComponent,
    PromptDialogComponent,
    AdvancedPromptDialogComponent,
    OrderTypesDialogComponent,
    ImageCropperModule,
    StopPropagationDirective,
    ImageSelectorButtonComponent,
    FileImageDirective,
    DiscountCouponPipe,
    SortDialogComponent,
    MemberAutocompleteComponent,

    MatRippleModule,
    MatDividerModule,
    MatTabsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatDialogModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatListModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatSidenavModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    LayoutModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatBottomSheetModule,
    MatExpansionModule,
    MatStepperModule,
  ],
})
export class SharedModule {}
