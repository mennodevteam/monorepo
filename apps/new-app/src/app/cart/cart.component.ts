import { Component } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { TopAppBarComponent } from '../common/components/top-app-bar/top-app-bar.component';
import { ProductItemsComponent } from './product-items/product-items.component';
import { CartService } from '../core/services/cart.service';
import { COMMON } from '../common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    TopAppBarComponent,
    ProductItemsComponent,
    COMMON,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  noteControl: FormControl;
  constructor(
    private cart: CartService,
    private location: PlatformLocation,
    private router: Router,
    private auth: AuthService,
  ) {
    this.noteControl = new FormControl(this.cart.note());
    this.noteControl.valueChanges.subscribe((value) => {
      this.cart.note.set(value);
    });
    if (this.cart.length() === 0) {
      this.location.back();
    }
  }

  submit() {
    if (this.auth.isGuestUser && this.cart.isLoginRequired) {
      this.router.navigate(['/login'], { queryParams: { returnPath: '/payment' } });
    } else {
      this.router.navigateByUrl('/payment');
    }
  }
}
