import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CampaignService } from '../../../core/services/campaign.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-campaign-welcome-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, RouterModule, CommonModule],
  templateUrl: './campaign-welcome-dialog.component.html',
  styleUrl: './campaign-welcome-dialog.component.scss',
})
export class CampaignWelcomeDialogComponent implements OnInit, OnDestroy {
  private readonly campaignService = inject(CampaignService);
  readonly campaign = computed(() => this.campaignService.activeCampaign());

  timeLeft = signal<string>('');
  private timerId?: any;

  ngOnInit() {
    this.updateCountdown();
    this.timerId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }

  private updateCountdown() {
    const campaign = this.campaign();
    if (!campaign || !campaign.showCountdown) return;

    const diff = new Date(campaign.endDate).getTime() - Date.now();
    if (diff <= 0) {
      this.timeLeft.set('کمپین پایان یافته است');
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    this.timeLeft.set(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
  }
}
