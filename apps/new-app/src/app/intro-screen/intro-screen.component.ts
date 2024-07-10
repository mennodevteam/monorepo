import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, ShopService } from '../core';
import { ActivatedRoute } from '@angular/router';
import { COMMON } from '../common';

@Component({
  selector: 'app-intro-screen',
  standalone: true,
  imports: [CommonModule, COMMON],
  templateUrl: './intro-screen.component.html',
  styleUrl: './intro-screen.component.scss',
})
export class IntroScreenComponent {
  constructor(
    private shopService: ShopService,
    private auth: AuthService,
  ) {}

  get loading() {
    return !this.shopService.shop || !this.auth.user
  }
}
