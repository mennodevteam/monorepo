import { Injectable } from '@angular/core';
import * as MatColorUtils from '@material/material-color-utilities';

const DEFAULT_COLOR = '#FFC107';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {
    this.themeFromSelectedColor();
  }

  themeFromSelectedColor(color?: string, isDark?: boolean): void {
    const theme = MatColorUtils.themeFromSourceColor(MatColorUtils.argbFromHex(color ?? DEFAULT_COLOR));
    this.createCustomProperties(isDark ? theme.schemes.dark.toJSON() : theme.schemes.light.toJSON());
  }

  createCustomProperties(schemes: any) {
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

        const value = MatColorUtils.hexFromArgb(schemes[key]);
        document.body.style.setProperty(`--sys-${keyText}`, value);
        tokenClassString += `.${keyText}-text{color:${value}}.${keyText}-background{background-color:${value}}`;
      }
    }
    sheet.replaceSync(tokenClassString);
  }
}
