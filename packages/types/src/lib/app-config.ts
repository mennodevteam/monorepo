import { Theme } from './theme';

export enum ThemeMode {
  auto,
  dark,
  light,
}
export class AppConfig {
  id: string;
  theme: Theme;
  themeMode: ThemeMode;
}
