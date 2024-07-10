import { Injectable } from '@angular/core';
import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';
import { ThemeMode } from '@menno/types';

const DEFAULT_COLOR = '#50F25A';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {
    this.setThemeFromColor();
  }

  setThemeFromColor(color = DEFAULT_COLOR, themeMode?: ThemeMode): void {
    let isDark = themeMode === ThemeMode.Dark;

    if (themeMode === ThemeMode.Auto) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDark = true;
      }
    }

    const theme = themeFromSourceColor(argbFromHex(color), [
      { name: 'primary', blend: false, value: argbFromHex(color) },
    ]);
    const core = theme.customColors[0];

    const darkJson = theme.schemes.dark.toJSON();
    darkJson.primary = core.dark.color;
    darkJson.onPrimary = core.dark.onColor;
    darkJson.primaryContainer = core.dark.colorContainer;
    darkJson.onPrimaryContainer = core.dark.onColorContainer;

    const lightJson = theme.schemes.light.toJSON();
    lightJson.primary = core.light.color;
    lightJson.onPrimary = core.light.onColor;
    lightJson.primaryContainer = core.light.colorContainer;
    lightJson.onPrimaryContainer = core.light.onColorContainer;

    if (isDark) document.body.classList.add('dark');
    this.createCustomProperties(isDark ? darkJson : lightJson);
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
