import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

export interface ShopTheme {
  mode?: ThemeMode;
  mainColor?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly defaultMode: ThemeMode = 'light';
  private readonly defaultMain = '#000000';
  private readonly document = inject(DOCUMENT);

  init(): void {
    this.setTheme({});
  }

  setTheme(theme: ShopTheme): void {
    const mode: ThemeMode = theme.mode === 'dark' ? 'dark' : this.defaultMode;
    const main = this.normalizeHex(theme.mainColor) ?? this.defaultMain;
    const onMain = this.getOnColor(main);

    const vars = mode === 'dark' ? this.getDarkVars(main, onMain) : this.getLightVars(main, onMain);
    this.applyVars(vars);
    this.applyModeClasses(mode);
  }

  private applyVars(vars: Record<string, string>): void {
    const root = this.document.documentElement;
    Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  }

  private applyModeClasses(mode: ThemeMode): void {
    const body = this.document.body;
    body.classList.toggle('shop-dark', mode === 'dark');
    body.classList.toggle('shop-light', mode !== 'dark');
  }

  private getLightVars(main: string, onMain: string): Record<string, string> {
    const primaryContainer = this.toContainer(main, 0.7);
    const onPrimaryContainer = this.getOnColor(primaryContainer);

    return {
      '--shop-main-color': main,
      '--shop-on-main-color': onMain,
      '--shop-main-container-color': primaryContainer,
      '--shop-on-main-container-color': onPrimaryContainer,
      '--shop-background-color': '#ffffff',
      '--shop-on-background-color': '#0f0f0f',
      '--shop-surface-color': '#ffffff',
      '--shop-on-surface-color': '#1a1a1a',
      '--shop-surface-low-color': '#f4f4f4',
      '--mat-sys-primary': main,
      '--mat-sys-on-primary': onMain,
      '--mat-sys-primary-container': primaryContainer,
      '--mat-sys-on-primary-container': onPrimaryContainer,
      '--mat-sys-background': '#ffffff',
      '--mat-sys-on-background': '#0f0f0f',
      '--mat-sys-surface': '#ffffff',
      '--mat-sys-on-surface': '#1a1a1a',
      '--mat-sys-surface-container-low': '#f4f4f4',
    };
  }

  private getDarkVars(main: string, onMain: string): Record<string, string> {
    const primaryContainer = this.toContainer(main, 0.4);
    const onPrimaryContainer = this.getOnColor(primaryContainer);

    return {
      '--shop-main-color': main,
      '--shop-on-main-color': onMain,
      '--shop-main-container-color': primaryContainer,
      '--shop-on-main-container-color': onPrimaryContainer,
      '--shop-background-color': '#0f0f0f',
      '--shop-on-background-color': '#f6f6f6',
      '--shop-surface-color': '#1a1a1a',
      '--shop-on-surface-color': '#f6f6f6',
      '--shop-surface-low-color': '#242424',
      '--mat-sys-primary': main,
      '--mat-sys-on-primary': onMain,
      '--mat-sys-primary-container': primaryContainer,
      '--mat-sys-on-primary-container': onPrimaryContainer,
      '--mat-sys-background': '#0f0f0f',
      '--mat-sys-on-background': '#f6f6f6',
      '--mat-sys-surface': '#1a1a1a',
      '--mat-sys-on-surface': '#f6f6f6',
      '--mat-sys-surface-container-low': '#242424',
    };
  }

  private normalizeHex(color?: string | null): string | null {
    if (!color) {
      return null;
    }

    const value = color.trim();

    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      return value.toLowerCase();
    }

    if (/^[0-9a-fA-F]{6}$/.test(value)) {
      return `#${value.toLowerCase()}`;
    }

    if (/^#[0-9a-fA-F]{3}$/.test(value)) {
      const [, a, b, c] = value.toLowerCase();
      return `#${a}${a}${b}${b}${c}${c}`;
    }

    return null;
  }

  private getOnColor(hex: string): string {
    const { r, g, b } = this.hexToRgb(hex);
    const luminance = this.relativeLuminance(r, g, b);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const normalized = hex.replace('#', '');
    const expanded = normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized;
    const num = parseInt(expanded, 16);

    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  private relativeLuminance(r: number, g: number, b: number): number {
    const toLinear = (component: number): number => {
      const channel = component / 255;
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    };

    const rl = toLinear(r);
    const gl = toLinear(g);
    const bl = toLinear(b);

    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
  }

  private toContainer(hex: string, ratioTowardWhite: number): string {
    const { r, g, b } = this.hexToRgb(hex);
    const mix = (channel: number): number => {
      const mixed = Math.round(channel + (255 - channel) * ratioTowardWhite);
      return Math.max(0, Math.min(255, mixed));
    };
    return this.rgbToHex(mix(r), mix(g), mix(b));
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number): string => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

