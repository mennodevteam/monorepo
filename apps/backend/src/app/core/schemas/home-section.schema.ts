import { EntitySchema } from 'typeorm';
import { HomeSection, HomeSectionType } from '@menno/types';

export const HomeSectionSchema = new EntitySchema<HomeSection>({
  name: 'HomeSection',
  target: HomeSection,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    type: {
      type: 'enum',
      enum: HomeSectionType,
    },
    position: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    config: {
      type: 'simple-json',
    },
    createdAt: {
      type: 'timestamptz',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamptz',
      updateDate: true,
    },
    deletedAt: {
      type: 'timestamptz',
      deleteDate: true,
      nullable: true,
    },
  },
  relations: {
    shop: {
      type: 'many-to-one',
      target: 'Shop',
    },
  },
});

