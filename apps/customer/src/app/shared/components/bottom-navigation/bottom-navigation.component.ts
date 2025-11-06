import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.scss',
})
export class BottomNavigationComponent {
  navItems = [
    { path: '/home', label: 'Home', icon: 'home_border' },
    { path: '/cart', label: 'Cart', icon: 'shopping_cart' },
    { path: '/orders', label: 'Orders', icon: 'inventory_2' },
    { path: '/profile', label: 'Profile', icon: 'person' },
  ];
}

