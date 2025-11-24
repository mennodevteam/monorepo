import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InitialParamsService {
  readonly params: URLSearchParams;

  constructor() {
    this.params = new URLSearchParams(window.location.search);
  }

  getValue(key: string) {
    return this.params.get(key) || null;
  }
}
