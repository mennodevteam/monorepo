import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  constructor() {
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
