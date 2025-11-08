import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxSearchNormal1Outline } from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-home-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, NgIcon],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  providers: [
    provideIcons({ saxSearchNormal1Outline }),
  ],
})
export class HomeToolbarComponent {
  searchIcon = saxSearchNormal1Outline;
}


