import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Address } from '@menno/types';

@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './address-card.component.html',
  styleUrl: './address-card.component.scss',
})
export class AddressCardComponent {
  address = input<Address | undefined>();
}

