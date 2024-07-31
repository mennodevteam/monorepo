import { Component, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';
import { debounceTime } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';

type SearchResult = {
  title: string;
  address: string;
  neighbourhood: string;
  region: string;
  type: string;
  category: 'place' | 'region' | 'municipal';
  location: {
    x: number;
    y: number;
  };
};

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, COMMON, MatToolbarModule, TopAppBarComponent, ReactiveFormsModule, MatListModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
})
export class SearchComponent {
  searchControl = new FormControl();
  items = signal<SearchResult[] | null>([]);

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private location: PlatformLocation
  ) {
    this.searchControl.valueChanges.pipe(debounceTime(600)).subscribe(async (query) => {
      if (query.length > 2) {
        this.items.set(null);
        const res = await this.search(query).toPromise();
        this.items.set(res?.items || []);
      } else {
        this.items.set([]);
      }
    });
  }

  search(val: string) {
    return this.http.get<{ count: number; items: SearchResult[] }>(
      `https://api.neshan.org/v1/search?term=${val}&lat=${this.coordinate?.[0]}&lng=${this.coordinate?.[1]}`,
      {
        headers: {
          'Api-Key': environment.neshanSearchApiKey,
        },
      },
    );
  }

  get coordinate() {
    const query = this.route.snapshot.queryParams;
    if (query['lat'] && query['lng']) return [Number(query['lat']), query['lng']];
    return;
  }

  select(item: SearchResult) {
    this.location.back();
    setTimeout(() => {
      this.router.navigate(['/address/map'], {
        queryParams: { lat: item.location.y, lng: item.location.x },
        replaceUrl: true,
      });
    }, 500);
  }
}
