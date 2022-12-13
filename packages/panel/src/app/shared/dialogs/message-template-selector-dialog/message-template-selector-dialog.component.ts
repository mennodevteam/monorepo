import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { SmsTemplate } from '@menno/types';
import { MessageTemplateService } from '../../../core/services/messageTemplate.service';
import { AdvancedPromptDialogComponent } from '../advanced-prompt-dialog/advanced-prompt-dialog.component';

@Component({
  selector: 'app-message-template-selector-dialog',
  templateUrl: './message-template-selector-dialog.component.html',
  styleUrls: ['./message-template-selector-dialog.component.scss']
})
export class MessageTemplateSelectorDialogComponent implements OnInit {
  allTemplates: SmsTemplate[];
  templates = new BehaviorSubject<SmsTemplate[]>(undefined);
  queryControl = new FormControl('');
  constructor(
    private templateService: MessageTemplateService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<any>,
    private http: HttpClient,
    private snack: MatSnackBar,
  ) { }

  async ngOnInit() {
    this.queryControl.valueChanges.subscribe(() => {
      this.set();
    })
    this.load();
  }

  async load() {
    this.allTemplates = await this.templateService.getMessageTemplates();
    this.allTemplates.sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf());
    this.set();
  }

  set() {
    const q = this.queryControl.value;
    this.templates.next(this.allTemplates.filter(x => x.title.indexOf(q) > -1 || x.message.indexOf(q) > -1))
  }

  select(template: SmsTemplate) {
    if (template.isVerified) this.dialogRef.close(template);
  }

  async openAddMessageTemplDialog(item?: SmsTemplate) {
    const dto: SmsTemplate = await this.dialog
      .open(AdvancedPromptDialogComponent, {
        width: '400px',
        data: {
          // title: this.translate.instant('addMessageTemplateDialog.newTitle'),
          fields: {
            title: {
              label: this.translate.instant('addMessageTemplateDialog.title'),
              control: new FormControl(item ? item.title : undefined, [
                Validators.required,
              ]),
            },
            message: {
              label: this.translate.instant('addMessageTemplateDialog.message'),
              placeholder: this.translate.instant('addMessageTemplateDialog.messagePlaceholder'),
              type: 'textarea',
              rows: 5,
              control: new FormControl(item ? item.message : undefined, [
                Validators.required,
              ]),
            },
          },
          description: this.translate.instant('addMessageTemplateDialog.description'),
        },
      })
      .afterClosed()
      .toPromise();
    if (dto) {
      if (item) dto.id = item.id;
      this.http.post<SmsTemplate>('messageTemplates', dto).subscribe((template) => {
        this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
        this.translate.instant('app.savedSuccessfully'),
          this.load();
      });
    }
  }
}
