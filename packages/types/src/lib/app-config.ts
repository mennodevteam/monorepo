export enum ThemeMode {
  auto,
  dark,
  light,
}
export class AppConfig {
  id: string;
  themeColor: string;
  themeMode: ThemeMode;
}
