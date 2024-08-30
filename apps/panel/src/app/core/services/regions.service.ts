import { HttpClient } from '@angular/common/http';
import { computed, Injectable, signal } from '@angular/core';
import { Region, State } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegionsService {
  private _loading = new BehaviorSubject<void>(undefined);
  regions = signal<Region[]>([]);
  states = computed(() => {
    const regions = this.regions();
    return Region.states(regions);
  });
  constructor(private http: HttpClient) {
    this.loadRegion();
  }

  async loadRegion() {
    let regions = await this.http.get<Region[]>('regions').toPromise();
    if (regions) {
      regions = regions.filter((x) => x.state);
      regions.sort((a, b) => `${a.state} > $${a.title}`.localeCompare(`${b.state} > $${b.title}`));
      this.regions.set(regions);
    }
    this._loading.complete();
  }

  async getResolver() {
    if (this.regions()?.length) return;
    return this._loading.asObservable().toPromise();
  }
}
