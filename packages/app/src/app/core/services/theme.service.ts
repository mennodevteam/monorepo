import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';

export const LOCAL_STORAGE_THEME_COLOR_KEY = 'appThemeString';
export const DEFAULT_THEME_COLOR = 'amber';

export const COLORS = ['default', 'red', 'blue', 'green', 'amber'];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _color = DEFAULT_THEME_COLOR;
  private _mode?: string;
  private _renderer: Renderer2;
  private head: HTMLElement;

  constructor(
    private rendererFactory: RendererFactory2,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.head = this.document.head;
    this._renderer = this.rendererFactory.createRenderer(null, null);

    const localStorageTheme = localStorage.getItem(LOCAL_STORAGE_THEME_COLOR_KEY);
    if (localStorageTheme) {
      this.color = localStorageTheme;
    }
  }

  set color(val: string) {
    if (COLORS.indexOf(val) === -1) return;
    if (val === 'default') this.setColor(val);
    else {
      this.loadCss(`${val}-theme.css`).then(() => {
        this.setColor(val);
      });
    }
    this.setColor(val);
  }

  get color() {
    return `${this._color}-theme`;
  }

  private setColor(val: string) {
    if (COLORS.indexOf(val) > -1) {
      localStorage.setItem(LOCAL_STORAGE_THEME_COLOR_KEY, val);
      this._color = val;
      this.html.setAttribute('theme-color', this.color);
    }
  }

  set mode(val: string) {
    if (val === 'dark' || val === 'light') {
      this._mode = val;
      this.html.classList.add(this.mode);
    }
  }

  get mode() {
    if (this._mode) {
      return `${this._mode}-mode`;
    }
    return '';
  }

  private get html() {
    return document.getElementsByTagName('html')[0];
  }

  private async loadCss(filename: string) {
    return new Promise((resolve) => {
      const linkEl: HTMLElement = this._renderer.createElement('link');
      this._renderer.setAttribute(linkEl, 'rel', 'stylesheet');
      this._renderer.setAttribute(linkEl, 'type', 'text/css');
      this._renderer.setAttribute(linkEl, 'href', filename);
      this._renderer.setProperty(linkEl, 'onload', resolve);
      this._renderer.appendChild(this.head, linkEl);
    });
  }
}
