import { Address, Region, Shop } from '@menno/types';
import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../auth/public.decorator';

@Controller('regions')
export class RegionsController {
  constructor(
    @InjectRepository(Region)
    private regionsRepo: Repository<Region>,
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(Address)
    private addressRepo: Repository<Address>,
  ) {}

  @Public()
  @Get()
  find(): Promise<Region[]> {
    return this.regionsRepo.find({
      order: {
        title: 'ASC',
      },
    });
  }

  @Public()
  @Get('reset')
  async reset(): Promise<void> {
    const regions = await this.regionsRepo.find();
    const shops = await this.shopsRepo.find({ relations: ['region'] });
    shops.forEach(async (shop) => {
      if (shop.region && !shop.region.state) {
        const region = regions.find((x) => x.title === shop.region.title && x.state);
        if (region) await this.shopsRepo.update(shop.id, { region: { id: region.id } });
      }
    });

    const addresses = await this.addressRepo.find({ relations: ['region'] });
    addresses.forEach(async (address) => {
      if (address.region && !address.region.state) {
        const region = regions.find((x) => x.title === address.region.title && x.state);
        if (region) await this.addressRepo.update(address.id, { region: { id: region.id } });
      }
    });
  }
}
