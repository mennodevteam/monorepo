import { AppConfig, ThemeMode } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const AppConfigSchema = new EntitySchema<AppConfig>({
  name: 'AppConfig',
  target: AppConfig,
  columns: {
    id: {
      type: 'uuid',
      generated: 'uuid',
      primary: true,
    },
    themeMode: {
      type: 'enum',
      enum: ThemeMode,
      default: ThemeMode.auto,
    },
  },
  relations: {
    theme: {
      type: 'many-to-one',
      target: 'Theme',
      nullable: true,
    }
  }
});
