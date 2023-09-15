import { Component } from '@angular/core';
import { ClubService } from '../core/services/club.service';

@Component({
  selector: 'pages',
  templateUrl: './pages.component.html',
  styleUrls: ['./pages.component.scss'],
})
export class PagesComponent {
  constructor(private clubService: ClubService){}
}
