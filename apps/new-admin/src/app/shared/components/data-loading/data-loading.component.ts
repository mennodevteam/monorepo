import { Component } from '@angular/core';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'

@Component({
  selector: 'app-data-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './data-loading.component.html',
  styleUrl: './data-loading.component.scss',
})
export class DataLoadingComponent {}
