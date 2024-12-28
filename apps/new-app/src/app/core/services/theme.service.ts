import { Injectable } from '@angular/core';
import { argbFromHex, argbFromRgba } from '@material/material-color-utilities';
import { ThemeMode } from '@menno/types';

const DEFAULT_COLOR = '#50F25A';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeMode?: ThemeMode;
  primary: string;
  background: string;

  constructor() {
    const localThemeColor = localStorage.getItem('appThemeColor');
    this.setThemeFromColor(localThemeColor || undefined);
  }

  setThemeFromColor(color = DEFAULT_COLOR, themeMode?: ThemeMode): void {
    if (themeMode) this.themeMode = themeMode;
    if (this.isDark) document.body.classList.add('dark');
    this.primary = color;
    this.background = this.isDark ? '#0B0B0B' : '#FFFFFF';

    const schemes: any = {
      '--mat-sys-background': `light-dark(#FFFFFF, #0B0B0B)`,
      '--mat-sys-on-background': `light-dark(#161616, #FFFFFF)`,
      '--mat-sys-primary': `light-dark(${this.primary}, ${this.primary})`,
      '--mat-sys-on-primary': this.chooseTextColor(this.primary),
      '--mat-sys-primary-container': `light-dark(${this.primary}, ${this.primary})`,
      '--mat-sys-on-primary-container': this.chooseTextColor(this.primary),
      '--mat-sys-tertiary': `light-dark(#161616, #E6E6E6)`,
      '--mat-sys-on-tertiary': `light-dark(#FFFFFF, #131313)`,
      '--mat-sys-tertiary-container': `light-dark(#161616, #E6E6E6)`,
      '--mat-sys-on-tertiary-container': `light-dark(#FFFFFF, #131313)`,
      '--mat-sys-error': `#DB3B21`,
      '--mat-sys-on-error': `#FFFFFF`,
      '--mat-sys-surface': `light-dark(#FFFFFF, #131313)`,
      '--mat-sys-on-surface': `light-dark(#161616, #FFFFFF)`,
      '--mat-sys-surface-variant': `light-dark(#F2F3F4, #292B2B)`,
      '--mat-sys-on-surface-variant': `light-dark(#A5AAB0, #8C9090)`,
      '--mat-sys-outline': `light-dark(#727A82, #8C9090)`,
      '--mat-sys-outline-variant': `light-dark(#E5E7E8, #292B2B)`,
    };

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
        const value = schemes[key];
        document.body.style.setProperty(key, value);
        const rawKey = key.replace('--mat-sys-', '');
        tokenClassString += `.${rawKey}-text{color:${value} !important}.${rawKey}-background{background-color:${value} !important}`;
      }
    }
    try {
      sheet.replaceSync(tokenClassString);
    } catch (error) {
      const rules = tokenClassString.split('.').forEach((rule) => {
        if (rule) (sheet as any).insertRule(`.${rule}`, (sheet as any).cssRules.length);
      });
    }

    document.body.style.backgroundColor = this.background;
    localStorage.setItem('appBackgroundColor', this.background);
    localStorage.setItem('appThemeColor', color);
  }

  // private get schema() {
  // const textColor = this.chooseTextColor(this.color);
  // const darkSchema = this.theme.schemes.dark.toJSON();
  // darkSchema.background = argbFromHex('#0B0B0B');
  // darkSchema.onBackground = argbFromHex('#FFFFFF');
  // darkSchema.secondary = argbFromHex('#2EB85C');
  // darkSchema.onSecondary = argbFromHex('#FFFFFF');
  // darkSchema.tertiary = argbFromHex('#E6E6E6');
  // darkSchema.onTertiary = argbFromHex('#131313');
  // darkSchema.tertiaryContainer = argbFromHex('#E6E6E6');
  // darkSchema.onTertiaryContainer = argbFromHex('#131313');
  // darkSchema.error = argbFromHex('#DB3B21');
  // darkSchema.onError = argbFromHex('#FFFFFF');
  // darkSchema.surface = argbFromHex('#131313');
  // darkSchema.onSurface = argbFromHex('#FFFFFF');
  // darkSchema.surfaceVariant = argbFromHex('#292B2B');
  // darkSchema.surfaceVariant = argbFromHex('#292B2B');
  // darkSchema.onSurfaceVariant = argbFromHex('#8C9090');
  // darkSchema.outline = argbFromHex('#8C9090');
  // darkSchema.outlineVariant = argbFromHex('#292B2B');
  // darkSchema.shadow = argbFromRgba({ r: 43, g: 43, b: 43, a: 0.06 });
  // darkSchema.primary = argbFromHex(this.color);
  // darkSchema.onPrimary = argbFromHex(textColor);

  // const lightSchema = this.theme.schemes.light.toJSON();
  // lightSchema.background = argbFromHex('#FFFFFF');
  // lightSchema.onBackground = argbFromHex('#161616');
  // darkSchema.secondary = argbFromHex('#2EB85C');
  // darkSchema.onSecondary = argbFromHex('#FFFFFF');
  // lightSchema.tertiary = argbFromHex('#161616');
  // lightSchema.onTertiary = argbFromHex('#FFFFFF');
  // lightSchema.tertiaryContainer = argbFromHex('#161616');
  // lightSchema.onTertiaryContainer = argbFromHex('#FFFFFF');
  // lightSchema.error = argbFromHex('#DB3B21');
  // lightSchema.onError = argbFromHex('#FFFFFF');
  // lightSchema.surface = argbFromHex('#FFFFFF');
  // lightSchema.onSurface = argbFromHex('#161616');
  // lightSchema.surfaceVariant = argbFromHex('#F2F3F4');
  // lightSchema.onSurfaceVariant = argbFromHex('#A5AAB0');
  // lightSchema.outline = argbFromHex('#727A82');
  // lightSchema.outlineVariant = argbFromHex('#E5E7E8');
  // lightSchema.shadow = argbFromRgba({ r: 43, g: 43, b: 43, a: 0.06 });
  // lightSchema.primary = argbFromHex(this.color);
  // lightSchema.onPrimary = argbFromHex(textColor);

  //   if (this.isDark) return darkSchema;
  //   return lightSchema;
  // }

  private get isDark() {
    let isDark = this.themeMode === ThemeMode.Dark;

    if (this.themeMode === ThemeMode.Auto) {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        isDark = true;
      }
    }
    return isDark;
  }

  // private createCustomProperties(schemes: any) {
  //   let sheet = (globalThis as any)['material-tokens-class'];

  //   if (!sheet) {
  //     try {
  //       sheet = new CSSStyleSheet();
  //     } catch (error) {
  //       const styleElement = document.createElement('style');
  //       styleElement.id = 'material-tokens-class';
  //       document.head.appendChild(styleElement);
  //       sheet = styleElement.sheet;
  //     }
  //     (globalThis as any)['material-tokens-class'] = sheet;
  //     try {
  //       document.adoptedStyleSheets.push(sheet);
  //     } catch (error) {
  //       //
  //     }
  //   }

  //   let tokenClassString = ``;
  //   for (const key in schemes) {
  //     if (Object.prototype.hasOwnProperty.call(schemes, key)) {
  //       const keyText = key
  //         .replace(/([a-z])([A-Z])/g, '$1-$2')
  //         .replace(/[\s_]+/g, '-')
  //         .toLowerCase();

  //       const value = hexFromArgb(schemes[key]);
  //       document.body.style.setProperty(`--sys-${keyText}`, value);
  //       tokenClassString += `.${keyText}-text{color:${value} !important}.${keyText}-background{background-color:${value} !important}`;
  //     }
  //   }
  //   try {
  //     sheet.replaceSync(tokenClassString);
  //   } catch (error) {
  //     const rules = tokenClassString.split('.').forEach((rule) => {
  //       if (rule) (sheet as any).insertRule(`.${rule}`, (sheet as any).cssRules.length);
  //     });
  //   }
  // }

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

  get mode() {
    return this.themeMode;
  }
}
