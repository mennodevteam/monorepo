import { Address } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>
  ) {}

  findByUser(userId: string): Promise<Address[]> {
    return this.addressesRepository.find({
      where: { userId: userId },
      relations: ['deliveryArea'],
    });
  }

  save(region: Address): Promise<any> {
    return this.addressesRepository.save(<any>region);
  }

  async remove(regionId: string): Promise<void> {
    await this.addressesRepository.delete(regionId);
  }
}
