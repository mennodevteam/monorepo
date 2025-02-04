import { Injectable } from '@angular/core';
import {
  Scheme,
  Theme,
  argbFromHex,
  argbFromRgba,
  hexFromArgb,
  themeFromSourceColor,
} from '@material/material-color-utilities';
import { ThemeMode } from '@menno/types';

const DEFAULT_COLOR = '#50F25A';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private theme: Theme;
  private themeMode?: ThemeMode;
  private color: string;

  constructor() {
    const localThemeColor = localStorage.getItem('appThemeColor');
    this.setThemeFromColor(localThemeColor || undefined);
  }

  setThemeFromColor(color = DEFAULT_COLOR, themeMode?: ThemeMode): void {
    this.color = color;
    const theme = themeFromSourceColor(argbFromHex(color));
    this.themeMode = themeMode;
    this.theme = theme;
    if (this.isDark) document.body.classList.add('dark');
    this.createCustomProperties(this.schema);

    document.body.style.backgroundColor = this.background;
    localStorage.setItem('appBackgroundColor', this.background);
    localStorage.setItem('appThemeColor', color);
  }

  private get schema() {
    const textColor = this.chooseTextColor(this.color);
    const darkSchema = this.theme.schemes.dark.toJSON();
    darkSchema.background = argbFromHex('#0B0B0B');
    darkSchema.onBackground = argbFromHex('#FFFFFF');
    darkSchema.secondary = argbFromHex('#2EB85C');
    darkSchema.onSecondary = argbFromHex('#FFFFFF');
    darkSchema.tertiary = argbFromHex('#E6E6E6');
    darkSchema.onTertiary = argbFromHex('#131313');
    darkSchema.tertiaryContainer = argbFromHex('#E6E6E6');
    darkSchema.onTertiaryContainer = argbFromHex('#131313');
    darkSchema.error = argbFromHex('#DB3B21');
    darkSchema.onError = argbFromHex('#FFFFFF');
    darkSchema.surface = argbFromHex('#131313');
    darkSchema.onSurface = argbFromHex('#FFFFFF');
    darkSchema.surfaceVariant = argbFromHex('#292B2B');
    darkSchema.surfaceVariant = argbFromHex('#292B2B');
    darkSchema.onSurfaceVariant = argbFromHex('#8C9090');
    darkSchema.outline = argbFromHex('#8C9090');
    darkSchema.outlineVariant = argbFromHex('#292B2B');
    darkSchema.shadow = argbFromRgba({ r: 43, g: 43, b: 43, a: 0.06 });
    darkSchema.primary = argbFromHex(this.color);
    darkSchema.onPrimary = argbFromHex(textColor);

    const lightSchema = this.theme.schemes.light.toJSON();
    lightSchema.background = argbFromHex('#FFFFFF');
    lightSchema.onBackground = argbFromHex('#161616');
    darkSchema.secondary = argbFromHex('#2EB85C');
    darkSchema.onSecondary = argbFromHex('#FFFFFF');
    lightSchema.tertiary = argbFromHex('#161616');
    lightSchema.onTertiary = argbFromHex('#FFFFFF');
    lightSchema.tertiaryContainer = argbFromHex('#161616');
    lightSchema.onTertiaryContainer = argbFromHex('#FFFFFF');
    lightSchema.error = argbFromHex('#DB3B21');
    lightSchema.onError = argbFromHex('#FFFFFF');
    lightSchema.surface = argbFromHex('#FFFFFF');
    lightSchema.onSurface = argbFromHex('#161616');
    lightSchema.surfaceVariant = argbFromHex('#F2F3F4');
    lightSchema.onSurfaceVariant = argbFromHex('#A5AAB0');
    lightSchema.outline = argbFromHex('#727A82');
    lightSchema.outlineVariant = argbFromHex('#E5E7E8');
    lightSchema.shadow = argbFromRgba({ r: 43, g: 43, b: 43, a: 0.06 });
    lightSchema.primary = argbFromHex(this.color);
    lightSchema.onPrimary = argbFromHex(textColor);

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
      try {
        sheet = new CSSStyleSheet();
      } catch (error) {
        const styleElement = document.createElement('style');
        styleElement.id = 'material-tokens-class';
        document.head.appendChild(styleElement);
        sheet = styleElement.sheet;
      }
      (globalThis as any)['material-tokens-class'] = sheet;
      try {
        document.adoptedStyleSheets.push(sheet);
      } catch (error) {
        //
      }
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
    try {
      sheet.replaceSync(tokenClassString);
    } catch (error) {
      const rules = tokenClassString.split('.').forEach((rule) => {
        if (rule) (sheet as any).insertRule(`.${rule}`, (sheet as any).cssRules.length);
      });
    }
  }

  private getLuminance(hexColor: string): number {
    const argbColor = argbFromHex(hexColor);
    // Convert to a normalized RGB color
    const r = ((argbColor >> 16) & 0xff) / 255;
    const g = ((argbColor >> 8) & 0xff) / 255;
    const b = (argbColor & 0xff) / 255;

    // Calculate luminance
    const a = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  private getContrastRatio(hexColor1: string, hexColor2: string): number {
    const lum1 = this.getLuminance(hexColor1);
    const lum2 = this.getLuminance(hexColor2);
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  }

  chooseTextColor(backgroundColor: string): string {
    const white = '#FFFFFF';
    const black = '#000000';

    const contrastWithWhite = this.getContrastRatio(backgroundColor, white);
    const contrastWithBlack = this.getContrastRatio(backgroundColor, black);
    return contrastWithWhite > contrastWithBlack ? white : black;
  }

  get primary() {
    return hexFromArgb(this.schema.primary);
  }

  get background() {
    return hexFromArgb(this.schema.background);
  }

  get mode() {
    return this.themeMode;
  }
}
