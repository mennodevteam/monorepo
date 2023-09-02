import { Theme } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const ThemeSchema = new EntitySchema<Theme>({
  name: 'Theme',
  target: Theme,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    title: {
      type: String,
    },
    key: {
      type: String,
    },
    primaryColor: {
      type: String,
    },
    images: {
      type: String,
      default: [],
      array: true,
    },
  },
});
