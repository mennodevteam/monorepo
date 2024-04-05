import { Component } from '@angular/core';
import { Mission, Status } from '@menno/types';
import { ClubService } from '../../../core/services/club.service';
import { AlertDialogService } from '../../../core/services/alert-dialog.service';
import { sortByCreatedAtDesc } from '@menno/utils';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'menno-mission-list',
  templateUrl: './mission-list.component.html',
  styleUrls: ['./mission-list.component.scss'],
})
export class MissionListComponent {
  missions: Mission[];
  loading = false;
  Status = Status;
  displayedColumns = ['title', 'status', 'date', 'actions'];

  constructor(private club: ClubService, private alertDialogService: AlertDialogService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.club.getMissions().then((missions) => {
      if (missions) {
        this.missions = missions;
        this.missions.sort(sortByCreatedAtDesc);
      }
      this.loading = false;
    });
  }

  async changeStatus(mission: Mission, ev: MatSlideToggleChange) {
    let prevStatus = mission.status;
    let newStatus = prevStatus === Status.Active ? Status.Inactive : Status.Active;
    mission.status = Status.Pending;
    try {
      await this.club.saveMission({
        id: mission.id,
        status: newStatus,
      } as Mission);
      mission.status = newStatus;
    } catch (error) {
      mission.status = prevStatus;
    }
  }

  async remove(mission: Mission) {
    if (await this.alertDialogService.removeItem(mission.title)) {
      await this.club.removeMission(mission.id);
      this.load();
    }
  }
}
