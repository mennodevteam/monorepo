import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.scss',
})
export class BottomNavigationComponent {
  navItems = [
    { path: '/home', label: 'Home', icon: '🏠' },
    { path: '/cart', label: 'Cart', icon: '🛒' },
    { path: '/orders', label: 'Orders', icon: '📦' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];
}

