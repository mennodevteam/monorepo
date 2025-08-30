import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [COMMON, DatePipe, TopAppBarComponent],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {}
