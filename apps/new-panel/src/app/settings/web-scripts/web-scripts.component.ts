import { Component, inject, computed } from '@angular/core';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogService } from '../../core/services/dialog.service';
import { PromptFields } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { ShopService } from '../../shop/shop.service';
import { WebScript } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-web-scripts',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './web-scripts.component.html',
  styleUrl: './web-scripts.component.scss',
})
export class WebScriptsComponent {
  private readonly dialog = inject(DialogService);
  private readonly shopService = inject(ShopService);
  private readonly translate = inject(TranslateService);

  // Get scripts from shop service
  readonly scripts = computed(() => {
    const shopScripts = this.shopService.data()?.scripts || [];
    return shopScripts;
  });

  addScript() {
    const fields: PromptFields = {
      name: {
        label: this.translate.instant('webScripts.scriptName'),
        control: new FormControl('', [Validators.required]),
        placeholder: this.translate.instant('webScripts.scriptNamePlaceholder'),
        type: 'text',
      },
      headScript: {
        label: this.translate.instant('webScripts.headScript'),
        control: new FormControl(''),
        placeholder: this.translate.instant('webScripts.headScriptPlaceholder'),
        type: 'textarea',
        rows: 6,
        ltr: true,
        eng: true,
      },
      bodyScript: {
        label: this.translate.instant('webScripts.bodyScript'),
        control: new FormControl(''),
        placeholder: this.translate.instant('webScripts.bodyScriptPlaceholder'),
        type: 'textarea',
        rows: 6,
        ltr: true,
        eng: true,
      },
    };

    this.dialog
      .prompt(this.translate.instant('webScripts.addScript'), fields, {
        description: this.translate.instant('webScripts.addScriptDescription'),
        config: {
          width: '800px',
        },
      })
      .then((result) => {
        if (result) {
          const currentScripts = this.shopService.data()?.scripts || [];
          const newScript: WebScript = {
            name: result.name,
            head: encodeURIComponent(result.headScript || ''),
            body: encodeURIComponent(result.bodyScript || ''),
            active: true,
          };

          this.shopService.saveMutation.mutate({
            scripts: [...currentScripts, newScript],
          });
        }
      });
  }

  editScript(script: any, index: number) {
    const fields: PromptFields = {
      name: {
        label: this.translate.instant('webScripts.scriptName'),
        control: new FormControl(script.name, [Validators.required]),
        placeholder: this.translate.instant('webScripts.scriptNamePlaceholder'),
        type: 'text',
      },
      headScript: {
        label: this.translate.instant('webScripts.headScript'),
        control: new FormControl(script.head ? decodeURIComponent(script.head) : ''),
        placeholder: this.translate.instant('webScripts.headScriptPlaceholder'),
        type: 'textarea',
        rows: 6,
        ltr: true,
        eng: true,
      },
      bodyScript: {
        label: this.translate.instant('webScripts.bodyScript'),
        control: new FormControl(script.body ? decodeURIComponent(script.body) : ''),
        placeholder: this.translate.instant('webScripts.bodyScriptPlaceholder'),
        type: 'textarea',
        rows: 6,
        ltr: true,
        eng: true,
      },
    };

    this.dialog
      .prompt(this.translate.instant('webScripts.editScript'), fields, {
        description: this.translate.instant('webScripts.editScriptDescription'),
        config: {
          width: '800px',
        },
      })
      .then((result) => {
        if (result) {
          const currentScripts = this.shopService.data()?.scripts || [];

          const updatedScripts = [...currentScripts];
          updatedScripts[index] = {
            name: result.name,
            head: encodeURIComponent(result.headScript || ''),
            body: encodeURIComponent(result.bodyScript || ''),
            active: script.active,
          };

          this.shopService.saveMutation.mutate({
            scripts: updatedScripts,
          });
        }
      });
  }

  deleteScript(script: any, index: number) {
    this.dialog
      .alert(this.translate.instant('webScripts.deleteScript'), this.translate.instant('webScripts.deleteScriptMessage'), {
        config: { data: { confirm: true } },
      })
      .then((confirmed: boolean) => {
        if (confirmed) {
          const currentScripts = this.shopService.data()?.scripts || [];

          const updatedScripts = currentScripts.filter((_, i) => i !== index);

          this.shopService.saveMutation.mutate({
            scripts: updatedScripts,
          });
        }
      });
  }

  toggleScript(script: any, index: number) {
    const currentScripts = this.shopService.data()?.scripts || [];

    const updatedScripts = [...currentScripts];
    updatedScripts[index] = {
      ...updatedScripts[index],
      active: !script.active,
    };

    this.shopService.saveMutation.mutate({
      scripts: updatedScripts,
    });
  }
}
