import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SwUpdate } from '@angular/service-worker';
import { UpdateDialogComponent } from '../../shared/dialogs/update-dialog/update-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  constructor(private updates: SwUpdate, private dialog: MatDialog) {
    const currentVersion = localStorage.getItem('version');
    try {
      if (this.updates.isEnabled) {
        this.updates.versionUpdates.subscribe((ev: any) => {
          if (ev.latestVersion?.appData && ev.type == 'VERSION_READY') {
            localStorage.setItem('version', ev.latestVersion?.appData.version)

            if (ev.latestVersion?.appData?.forceReload) {
              window.location.reload();
            } else if (
              !ev.latestVersion?.appData.lazyReload &&
              ev.latestVersion?.appData.version != currentVersion
            ) {
              this.dialog
                .open(UpdateDialogComponent, {
                  data: ev.latestVersion?.appData,
                  disableClose: true,
                  width: '600px',
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res) {
                    window.location.reload();
                  }
                });
            }
          }
        });

        this.checkForUpdate();
        setInterval(() => {
          this.checkForUpdate();
        }, 60000);
      }
    } catch (error) {}
  }

  checkForUpdate() {
    this.updates.checkForUpdate();
  }
}
