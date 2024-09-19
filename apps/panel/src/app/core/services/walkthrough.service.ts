import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { WalkthroughDialogComponent } from '../../shared/dialogs/walkthrough-dialog/walkthrough-dialog.component';
const WIDTH = `800px`;
@Injectable({
  providedIn: 'root',
})
export class WalkthroughService {
  readonly dialog = inject(MatDialog);
  constructor() {
    // this.open(
    //   'به منّو خوش آمدید',
    //   'https://cdn.prod.website-files.com/5c7fdbdd4e3feeee8dd96dd2/62c758f54421ccca99af0e2a_Creating-app-walkthroughs-v1.png',
    //   'برای اولین بار که آمدید سم من ندیندرن تدینتبدرنتد نتیدب ندنیبرند هدی ندهتدیب ب',
    // );
  }

  open(title: string, image: string, description: string, action?: string) {
    this.dialog.open(WalkthroughDialogComponent, {
      data: {
        title,
        image,
        description,
        action
      },
      width: WIDTH,
      disableClose: true,
    });
  }
}
