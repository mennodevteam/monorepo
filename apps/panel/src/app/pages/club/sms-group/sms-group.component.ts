import { Component } from '@angular/core';
import { ClubService } from '../../../core/services/club.service';
import { SmsGroup } from '@menno/types';

@Component({
  selector: 'sms-group',
  templateUrl: './sms-group.component.html',
  styleUrls: ['./sms-group.component.scss'],
})
export class SmsGroupComponent {
  displayedColumns = ['message', 'createdAt', 'receptors', 'cost', 'failed', 'inQueue', 'sent', 'scheduled'];
  smsGroups: SmsGroup[];
  loading = true;
  constructor(private club: ClubService) {
    this.load();
  }

  async load() {
    const g = await this.club.filterSms({ take: 25 });
    this.smsGroups = g[0];
    this.loading = false;
  }
}
