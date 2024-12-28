import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { SearchMemberAutocompleteComponent } from '../../../shared/components/search-member-autocomplete/search-member-autocomplete.component';
import { Member, User } from '@menno/types';
import { NewOrdersService } from '../new-order.service';
import { SHARED } from '../../../shared';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, MatCardModule, SearchMemberAutocompleteComponent, SHARED],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss',
})
export class CustomerComponent {
  readonly service = inject(NewOrdersService);
  User = User;

  selectUser(member?: Member | null) {
    if (member) {
      this.service.customer.set(member?.user);
      this.service.dirty.set(true);
    }
  }

  clearMember() {
    this.service.customer.set(undefined);
    this.service.dirty.set(true);
  }
}
