import { Component, effect, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { SHARED } from '../..';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { debounceTime, distinctUntilChanged, lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FilterMemberDto, Member, User } from '@menno/types';
import { PersianNumberService } from '@menno/utils';

@Component({
  selector: 'app-search-member-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    SHARED,
    ReactiveFormsModule,
  ],
  templateUrl: './search-member-autocomplete.component.html',
  styleUrl: './search-member-autocomplete.component.scss',
})
export class SearchMemberAutocompleteComponent {
  private readonly http = inject(HttpClient);
  searchControl = new FormControl('');
  searchQuery = signal('');
  userSelect = output<Member | null>();
  selectedMember = signal<Member | null>(null);
  User = User;

  query = injectQuery(() => ({
    queryKey: ['searchMember', this.searchQuery()],
    queryFn: () =>
      lastValueFrom(
        this.http.post<[Member[], number]>('/members/filter', {
          query: this.searchQuery(),
          take: 25,
        } as FilterMemberDto),
      ),
    enabled: this.searchQuery().length > 2,
  }));

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300), // Wait for 300ms pause in events
        distinctUntilChanged(), // Only emit if the value is different
      )
      .subscribe((value) => {
        if (value) this.searchQuery.set(PersianNumberService.toEnglish(value));
      });

    effect(() => {
      this.userSelect.emit(this.selectedMember());
    });
  }

  displayFn(member: Member): string {
    if (member) {
      return `${User.fullName(member.user)} (${member.user.mobilePhone})`;
    }
    return '';
  }

  select(ev: MatAutocompleteSelectedEvent) {
    if (ev.option.value) this.selectedMember.set(ev.option.value);
  }
}
