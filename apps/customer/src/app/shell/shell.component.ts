import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { BottomNavigationComponent } from '../shared/components/bottom-navigation/bottom-navigation.component';
import { RootAppBarComponent } from '../shared/components/root-app-bar/root-app-bar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, BottomNavigationComponent, RootAppBarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private router = inject(Router);
  loading = false;

  ngOnInit(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loading = true;
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading = false;
      }
    });
  }
}

