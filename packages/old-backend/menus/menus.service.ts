import { Menu } from '@menno/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private menusRepository: Repository<Menu>
  ) {}

  findOne(id: string): Promise<Menu> {
    return this.menusRepository.findOne({
      where: { id },
      relations: ['categories', 'categories.products', 'costs'],
    });
  }
}
