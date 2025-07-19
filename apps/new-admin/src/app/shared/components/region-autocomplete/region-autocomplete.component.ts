import { Component, computed, effect, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { SHARED } from '../..';
import { Region, User } from '@menno/types';
import { REGIONS } from '../../../core/constants';

@Component({
  selector: 'app-region-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    SHARED,
    ReactiveFormsModule,
  ],
  templateUrl: './region-autocomplete.component.html',
  styleUrl: './region-autocomplete.component.scss',
})
export class RegionAutocompleteComponent {
  searchControl = new FormControl('');
  searchQuery = signal('');
  regionSelect = output<Region | null>();
  selectedRegion = signal<Region | null>(null);
  User = User;

  regions = computed(() => {
    return REGIONS.filter(
      (region) => region.title.includes(this.searchQuery()) || region.state?.includes(this.searchQuery()),
    );
  });

  constructor() {
    this.searchControl.valueChanges.subscribe((value) => {
      this.searchQuery.set(value || '');
    });

    effect(() => {
      this.regionSelect.emit(this.selectedRegion());
    });
  }

  displayFn(region: Region): string {
    if (region) {
      return `${region.state} > ${region.title}`;
    }
    return '';
  }

  select(ev: MatAutocompleteSelectedEvent) {
    if (ev.option.value) this.selectedRegion.set(ev.option.value);
  }
}
