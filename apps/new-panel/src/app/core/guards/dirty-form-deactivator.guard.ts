import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { DialogService } from '../services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

export interface FormComponent {
  canDeactivate: () => boolean;
}

export const dirtyFormDeactivator: CanDeactivateFn<FormComponent> = async (component: FormComponent) => {
  const dialog = inject(DialogService);
  const t = inject(TranslateService);
  if (!component.canDeactivate()) {
    if (await dialog.alert(t.instant('dirtyFormDialog.title'), t.instant('dirtyFormDialog.description'), {
      config: {
        data: {
          okText: t.instant('dirtyFormDialog.ok')
        }
      }
    })) {
      return true;
    }
    return false;
  }

  return true;
};
