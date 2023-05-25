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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
import { ImageCropperDialogComponent } from './dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { ImageLoaderDirective } from './directives/image-loader.directive';
import { MaterialPersianDateAdapter, PERSIAN_DATE_FORMATS } from '../core/material.persian-date.adapter';
import { OrderTypePipe } from './pipes/order-type.pipe';
import { OrderStatePipe } from './pipes/order-state.pipe';
import { OrderPaymentPipe } from './pipes/order-payment.pipe';
import { PhonePipe } from './pipes/phone.pipe';
import { StopPropagationDirective } from './directives/stop-propagation.directive';
import { RouterLink } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CopyClipboardDirective } from './directives/copy-clipboard.directive';

@NgModule({
  declarations: [
    PromptDialogComponent,
    AdvancedPromptDialogComponent,
    ImageCropperDialogComponent,
    GoBackDirective,
    SanitizeUrlPipe,
    PdatePipe,
    PhonePipe,
    SelectDialogComponent,
    AlertDialogComponent,
    ImageLoaderDirective,
    OrderTypePipe,
    OrderStatePipe,
    OrderPaymentPipe,
    StopPropagationDirective,
    CopyClipboardDirective,
    PhonePipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DragDropModule,
    ReactiveFormsModule,
    LayoutModule,
    ImageCropperModule,
    TranslateModule,
    MatToolbarModule,
    MatAutocompleteModule,
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
    MatProgressBarModule,
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
    OrderTypePipe,
    OrderStatePipe,
    OrderPaymentPipe,
    StopPropagationDirective,
    CopyClipboardDirective,
    PdatePipe,
    PhonePipe,
    AlertDialogComponent,
    SelectDialogComponent,
    TranslateModule,
    ImageLoaderDirective,

    FormsModule,
    ReactiveFormsModule,
    LayoutModule,
    MatToolbarModule,
    MatAutocompleteModule,
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
    MatProgressBarModule,
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
    PhonePipe,
  ],
})
export class SharedModule {}
