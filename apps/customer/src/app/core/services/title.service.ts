import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TitleService {
  private readonly _title = signal<string | undefined>(undefined);

  /**
   * Signal that provides the current page title.
   * Returns undefined if no title has been set, allowing fallback to route data or shop title.
   */
  readonly title = this._title.asReadonly();

  /**
   * Set the page title dynamically.
   * @param title The title to display, or undefined to clear and fall back to route data/shop title
   */
  setTitle(title: string | undefined): void {
    this._title.set(title);
  }

  /**
   * Clear the dynamically set title, allowing fallback to route data or shop title.
   */
  clearTitle(): void {
    this._title.set(undefined);
  }
}

