import { Component, computed, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CampaignService } from '../../../core/services/campaign.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getFileUrl } from '../../../core/functions';

@Component({
  selector: 'app-campaign-welcome-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, RouterModule, CommonModule],
  templateUrl: './campaign-welcome-dialog.component.html',
  styleUrl: './campaign-welcome-dialog.component.scss',
})
export class CampaignWelcomeDialogComponent implements OnInit, OnDestroy {
  private readonly campaignService = inject(CampaignService);
  private readonly router = inject(Router);

  readonly campaign = computed(() => this.campaignService.activeCampaign());
  readonly getFileUrl = getFileUrl;

  timeLeft = signal<string>('');
  private timerId?: any;

  ngOnInit() {
    this.updateCountdown();
    this.timerId = setInterval(() => this.updateCountdown(), 1000);
  }

  ngOnDestroy() {
    if (this.timerId) clearInterval(this.timerId);
  }

  onCtaClick() {
    const c = this.campaign();
    if (!c) return;

    const linkType = c.welcomeCtaLinkType;
    const linkValue = c.welcomeCtaLinkValue;

    // Fallback to legacy welcomeCtaUrl if welcomeCtaLinkType is not set
    if (!linkType) {
      if (c.welcomeCtaUrl) {
        this.navigateByStringUrl(c.welcomeCtaUrl);
      }
      return;
    }

    if (linkType === 'External') {
      if (linkValue) {
        if (linkValue.startsWith('http://') || linkValue.startsWith('https://')) {
          window.open(linkValue, '_blank');
        } else {
          // If it's a relative link, prepend protocol or navigate
          window.open('https://' + linkValue, '_blank');
        }
      }
    } else if (linkType === 'Category') {
      if (linkValue) {
        this.router.navigate(['/categories', linkValue]);
      }
    } else if (linkType === 'Product') {
      if (linkValue) {
        this.router.navigate(['/menu/product', linkValue]);
      }
    }
  }

  private navigateByStringUrl(url: string) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank');
    } else {
      this.router.navigateByUrl(url);
    }
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
