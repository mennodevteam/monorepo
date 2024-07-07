import { Injectable } from '@angular/core';
import {
  argbFromHex,
  themeFromSourceColor,
  applyTheme,
  hexFromArgb,
  TonalPalette,
} from '@material/material-color-utilities';

const DEFAULT_COLOR = '#FFC107';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {
    this.themeFromSelectedColor();
    setTimeout(() => {
      this.themeFromSelectedColor('#FFC107')
    }, 3000);
  }

  themeFromSelectedColor(color?: string, isDark?: boolean): void {
    // All calculations are made using numbers
    // we need HEX strings for use @material-utilitis-color apis
    const theme = themeFromSourceColor(argbFromHex(color ?? DEFAULT_COLOR));

    // ngular material tones
    const tones = [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 99, 100];

    // A colors Dictionary
    const colors = Object.entries(theme.palettes).reduce((acc: any, curr: [string, TonalPalette]) => {
      const hexColors = tones.map((tone) => ({ tone, hex: hexFromArgb(curr[1].tone(tone)) }));

      return { ...acc, [curr[0]]: hexColors };
    }, {});

    // Then we will apply the colors to the DOM :root element
    this.createCustomProperties(colors, 'p');
  }

  createCustomProperties(colorsFromPaletteConfig: any, paletteKey: 'p' | 't') {
    let styleString = ':root,:host{';

    for (const [key, palette] of Object.entries(colorsFromPaletteConfig)) {
      (palette as any[]).forEach(({ hex, tone }) => {
        if (key === 'primary') {
          styleString += `--${key}-${tone}:${hex};`;
        } else {
          styleString += `--${paletteKey}-${key}-${tone}:${hex};`;
        }
      });
    }

    styleString += '}';

    this.applyThemeString(styleString, 'angular-material-theme');
  }

  applyThemeString(themeString: string, ssName = 'angular-material-theme') {
    let sheet = (globalThis as any)[ssName];

    if (!sheet) {
      sheet = new CSSStyleSheet();
      (globalThis as any)[ssName] = sheet;
      document.adoptedStyleSheets.push(sheet);
    }
    sheet.replaceSync(themeString);
  }
}
