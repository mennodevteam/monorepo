import { Injectable } from '@angular/core';
import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';

const DEFAULT_COLOR = '#50F25A';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {
    this.themeFromSelectedColor();
  }

  themeFromSelectedColor(color = DEFAULT_COLOR, isDark?: boolean): void {
    const theme = themeFromSourceColor(argbFromHex(color ?? DEFAULT_COLOR));
    if (isDark) document.body.classList.add('dark')
    this.createCustomProperties(isDark ? theme.schemes.dark.toJSON() : theme.schemes.light.toJSON());
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
}
