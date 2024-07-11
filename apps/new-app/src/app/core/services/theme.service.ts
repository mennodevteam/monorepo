import { Injectable } from '@angular/core';
import { Theme, argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';
import { ThemeMode } from '@menno/types';

const DEFAULT_COLOR = '#50F25A';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private theme: Theme;
  private themeMode?: ThemeMode;

  constructor() {
    const localThemeColor = localStorage.getItem('appThemeColor');
    this.setThemeFromColor(localThemeColor || undefined);
  }

  setThemeFromColor(color = DEFAULT_COLOR, themeMode?: ThemeMode): void {
    const theme = themeFromSourceColor(argbFromHex(color));
    this.themeMode = themeMode;
    this.theme = theme;
    if (this.isDark) document.body.classList.add('dark');
    this.createCustomProperties(this.schema.toJSON());

    localStorage.setItem('appBackgroundColor', this.background);
    localStorage.setItem('appThemeColor', color);
  }

  private get schema() {
    const darkSchema = this.theme.schemes.dark;
    const lightSchema = this.theme.schemes.light;
    if (this.isDark) return darkSchema;
    return lightSchema;
  }

  private get isDark() {
    let isDark = this.themeMode === ThemeMode.Dark;

    if (this.themeMode === ThemeMode.Auto) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDark = true;
      }
    }
    return isDark;
  }

  private createCustomProperties(schemes: any) {
    let sheet = (globalThis as any)['material-tokens-class'];

    if (!sheet) {
      sheet = new CSSStyleSheet();
      (globalThis as any)['material-tokens-class'] = sheet;
      document.adoptedStyleSheets.push(sheet);
    }

    let tokenClassString = ``;
    for (const key in schemes) {
      if (Object.prototype.hasOwnProperty.call(schemes, key)) {
        const keyText = key
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .replace(/[\s_]+/g, '-')
          .toLowerCase();

        const value = hexFromArgb(schemes[key]);
        document.body.style.setProperty(`--sys-${keyText}`, value);
        tokenClassString += `.${keyText}-text{color:${value} !important}.${keyText}-background{background-color:${value} !important}`;
      }
    }
    sheet.replaceSync(tokenClassString);
  }

  get primary() {
    return hexFromArgb(this.schema.primary);
  }

  get background() {
    return hexFromArgb(this.schema.background);
  }
}
