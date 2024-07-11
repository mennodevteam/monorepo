import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ClubService } from '../core/services/club.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  constructor(
    private club: ClubService,
    private router: Router,
  ) {
    this.router.navigate(['/welcome'], { skipLocationChange: true });
    const elem: HTMLElement | null = document.querySelector('#pre-load-data-container');
    if (elem) {
      setTimeout(() => {
        elem.style.opacity = '0';
        setTimeout(() => {
          elem.remove();
        }, 320);
      }, 500);
    }
  }
}
