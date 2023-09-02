import { MemberTag } from '@menno/types';
import { EntitySchema } from 'typeorm';

export const MemberTagSchema = new EntitySchema<MemberTag>({
  name: 'MemberTag',
  target: MemberTag,
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    color: {
      type: String,
      nullable: true,
    },
    title: {
      type: String,
      nullable: true,
    },
  },
  relations: {
    club: {
      type: 'many-to-one',
      target: 'Club',
    },
  },
});
