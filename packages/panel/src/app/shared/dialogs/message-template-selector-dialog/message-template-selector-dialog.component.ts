import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SmsTemplate } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { MessageTemplateService } from '../../../core/services/messageTemplate.service';
import { AdvancedPromptDialogComponent } from '../advanced-prompt-dialog/advanced-prompt-dialog.component';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { sortByCreatedAtDesc } from '@menno/utils';

@Component({
  selector: 'app-message-template-selector-dialog',
  templateUrl: './message-template-selector-dialog.component.html',
  styleUrls: ['./message-template-selector-dialog.component.scss'],
})
export class MessageTemplateSelectorDialogComponent implements OnInit {
  allTemplates: SmsTemplate[];
  templates = new BehaviorSubject<SmsTemplate[] | undefined>(undefined);
  queryControl = new FormControl('');
  constructor(
    private templateService: MessageTemplateService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<any>,
    private http: HttpClient,
    private snack: MatSnackBar
  ) {}

  async ngOnInit() {
    this.queryControl.valueChanges.subscribe(() => {
      this.set();
    });
    this.load();
  }

  async load() {
    const templates = await this.templateService.getMessageTemplates();
    if (templates) {
      this.allTemplates = templates;
      this.allTemplates.sort(sortByCreatedAtDesc);
      this.set();
    }
  }

  set() {
    const q = this.queryControl.value;
    this.templates.next(
      this.allTemplates.filter((x) => !q || x.title.indexOf(q) > -1 || x.message.indexOf(q) > -1)
    );
  }

  select(template: SmsTemplate) {
    if (template.isVerified) this.dialogRef.close(template);
  }

  remove(template: SmsTemplate, ev: Event) {
    ev.stopPropagation();
    const ok = this.dialog
      .open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('messageTemplateSelectDialog.removeTitle', { value: template.title }),
          description: this.translate.instant('messageTemplateSelectDialog.removeDescription'),
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.templateService.removeMessageTemplate(template.id).then(() => {
            const index = this.allTemplates.findIndex((x) => x.id === template.id);
            if (index > -1) {
              this.allTemplates.splice(index, 1);
              this.set();
            }
          });
        }
      });
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
              control: new FormControl(item ? item.title : undefined, [Validators.required]),
            },
            message: {
              label: this.translate.instant('addMessageTemplateDialog.message'),
              placeholder: this.translate.instant('addMessageTemplateDialog.messagePlaceholder'),
              type: 'textarea',
              rows: 5,
              control: new FormControl(item ? item.message : undefined, [Validators.required]),
            },
          },
          description: this.translate.instant('addMessageTemplateDialog.description'),
        },
      })
      .afterClosed()
      .toPromise();
    if (dto) {
      if (item) dto.id = item.id;
      this.http.post<SmsTemplate>('smsTemplates', dto).subscribe((template) => {
        this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
        this.translate.instant('app.savedSuccessfully'), this.load();
      });
    }
  }
}
