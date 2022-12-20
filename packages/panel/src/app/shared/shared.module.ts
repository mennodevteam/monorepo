import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { PromptDialogComponent } from './dialogs/prompt-dialog/prompt-dialog.component';
import { MatSelectModule } from '@angular/material/select';
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

@NgModule({
  declarations: [
    PromptDialogComponent,
    AdvancedPromptDialogComponent,
    GoBackDirective,
    SanitizeUrlPipe,
    PdatePipe,
    SelectDialogComponent,
    AlertDialogComponent,
  ],
  imports: [
    CommonModule,
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
    MatInputModule,
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
    GoBackDirective,
    SanitizeUrlPipe,
    PdatePipe,
    AlertDialogComponent,
    SelectDialogComponent,

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
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatGridListModule,
    MatTooltipModule,
    MatChipsModule,
    MatRadioModule,
  ],
  providers: [MatDatepickerModule, DatePipe],
})
export class SharedModule {}
