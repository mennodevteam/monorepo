import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ActionsService } from './actions.service';
import { Action } from './entities/action';
import { FilterAction } from './entities/filter-action';

@Controller('actions')
export class ActionsController {
    constructor(
        private actionService: ActionsService
    ) { }

    @MessagePattern('actions/filter')
    filter(@Payload() filterAction: FilterAction): Promise<Action[]> {
        return this.actionService.filter(filterAction)
    }

    @MessagePattern('actions/count')
    count(@Payload() filterAction: FilterAction): Promise<number> {
        return this.actionService.count(filterAction)
    }

    @MessagePattern('actions/uniqueCount')
    uniqueCount(@Payload() filterAction: FilterAction): Promise<Action> {
        return this.actionService.uniqueCount(filterAction)
    }

    @MessagePattern('actions/insert')
    save(@Payload() action: Action): Promise<Action> {
        return this.actionService.save(action);
    }
}
