import { Component } from '@angular/core';
import { ClubService } from '../../../../core/services/club.service';
import { SmsGroup, SmsStatus } from '@menno/types';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'sms-list',
  templateUrl: './sms-list.component.html',
  styleUrls: ['./sms-list.component.scss'],
})
export class SmsListComponent {
  displayedColumns = ['message', 'receptor', 'cost', 'status'];
  smsGroup: SmsGroup;
  SmsStatus = SmsStatus;
  loading = true;
  constructor(private club: ClubService, private route: ActivatedRoute) {
    this.load();
  }

  async load() {
    const g = await this.club.getSmsGroup(this.route.snapshot.params['id']);
    g.list.sort((a, b) => a.status - b.status);
    this.smsGroup = g;
    this.loading = false;
  }
}
