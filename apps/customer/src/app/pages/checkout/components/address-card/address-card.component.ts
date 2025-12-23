import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Address } from '@menno/types';

@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './address-card.component.html',
  styleUrl: './address-card.component.scss',
})
export class AddressCardComponent {
  address = input<Address | undefined>();
}

