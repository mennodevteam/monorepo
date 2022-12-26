import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Region } from '@menno/types';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegionsService {
  private regions$: BehaviorSubject<Region[] | null>;
  constructor(private http: HttpClient) {
    this.regions$ = new BehaviorSubject<Region[] | null>(null);
    this.loadRegion();
  }

  get regionsObservable() {
    return this.regions$.asObservable();
  }

  get regions() {
    return this.regions$.value;
  }

  async loadRegion() {
    const regions = await this.http.get<Region[]>('regions').toPromise();
    if (regions) {
      this.regions$.next(regions);
    }
  }
}
