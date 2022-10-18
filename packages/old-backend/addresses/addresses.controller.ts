import { Address } from '@menno/types';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AddressesService } from './addresses.service';

@Controller('addresses')
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @MessagePattern('addresses/find')
  findByUser(userId: string): Promise<Address[]> {
    return this.addressesService.findByUser(userId);
  }

  @MessagePattern('addresses/save')
  save(dto: Address): Promise<Address> {
    return this.addressesService.save(dto);
  }

  @MessagePattern('addresses/remove')
  remove(id: string): Promise<void> {
    return this.addressesService.remove(id);
  }
}
