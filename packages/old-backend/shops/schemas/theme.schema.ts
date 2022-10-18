import { Theme } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ThemeSchema = new EntitySchema<Theme>({
  name: 'Theme',
  target: Theme,
  columns: {
    id: {
      type: String,
      primary: true,
    },
    title: {
      type: String,
      nullable: true,
    },
    details: {
      type: 'simple-json',
      nullable: true,
    },
    imageId: {
      type: String,
      nullable: true,
    },
  },
});
