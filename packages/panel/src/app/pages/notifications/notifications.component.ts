import { Component, OnInit } from '@angular/core';
import { LocalNotificationsService } from '../../core/services/local-notifications.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  constructor(
    public service: LocalNotificationsService,
  ) { }

  ngOnInit(): void {
  }

  close(notif: any) {
    this.service.remove(notif);
  }

  actionClick(notif: any, action: any) {
    this.service.actionClick(notif, action);
  }
}
