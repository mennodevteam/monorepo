import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { ActionSchema } from './entities/schema/action.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ActionSchema,
    ]),
  ],
  providers: [ActionsService],
  controllers: [ActionsController]
})
export class ActionsModule { }
