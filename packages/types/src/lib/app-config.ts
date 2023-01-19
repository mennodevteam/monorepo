import { Theme } from './theme';

export enum ThemeMode {
  Auto,
  Manual,
  Dark,
  Light,
}
export class AppConfig {
  id: string;
  theme: Theme;
  themeMode: ThemeMode;
}
