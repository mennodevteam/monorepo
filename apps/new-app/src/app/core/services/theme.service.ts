import { Injectable } from '@angular/core';
import {
  CorePalette,
  Scheme,
  TonalPalette,
  argbFromHex,
  hexFromArgb,
} from '@material/material-color-utilities';

const DEFAULT_COLOR = '#FFC107';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {
    this.themeFromSelectedColor();
  }

  themeFromSelectedColor(color?: string, isDark?: boolean): void {
    const corePalette = CorePalette.of(argbFromHex(DEFAULT_COLOR));
    corePalette.a3 = TonalPalette.fromInt(argbFromHex(isDark ? '#ffffff' : '#000000'));

    this.createCustomProperties(isDark ? Scheme.darkFromCorePalette(corePalette).toJSON() : Scheme.lightFromCorePalette(corePalette).toJSON());
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

        const value = hexFromArgb(schemes[key]);
        document.body.style.setProperty(`--sys-${keyText}`, value);
        tokenClassString += `.${keyText}-text{color:${value} !important}.${keyText}-background{background-color:${value} !important}`;
      }
    }
    sheet.replaceSync(tokenClassString);
  }
}
