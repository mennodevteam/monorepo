import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeSection, Shop } from '@menno/types';

@Injectable()
export class HomeSectionsService {
  constructor(
    @InjectRepository(HomeSection)
    private homeSectionsRepo: Repository<HomeSection>,
  ) {}

  async findAllByShop(shopId: string): Promise<HomeSection[]> {
    return this.homeSectionsRepo.find({
      where: { shop: { id: shopId } },
      order: { position: 'ASC' },
    });
  }

  async create(section: HomeSection, shopId: string): Promise<HomeSection> {
    const maxPosition = await this.homeSectionsRepo
      .createQueryBuilder('hs')
      .where('hs.shop.id = :shopId', { shopId })
      .select('MAX(hs.position)', 'max')
      .getRawOne();

    section.shop = { id: shopId } as Shop;
    section.position = (maxPosition?.max ?? -1) + 1;
    return this.homeSectionsRepo.save(section);
  }

  async update(id: string, section: Partial<HomeSection>, shopId: string): Promise<HomeSection> {
    const existing = await this.homeSectionsRepo.findOne({
      where: { id, shop: { id: shopId } },
    });

    if (!existing) {
      throw new Error('Home section not found');
    }

    // Prevent type change
    if (section.type && section.type !== existing.type) {
      throw new Error('Cannot change section type after creation');
    }

    Object.assign(existing, section);
    return this.homeSectionsRepo.save(existing);
  }

  async delete(id: string, shopId: string): Promise<void> {
    const section = await this.homeSectionsRepo.findOne({
      where: { id, shop: { id: shopId } },
    });

    if (!section) {
      throw new Error('Home section not found');
    }

    await this.homeSectionsRepo.softDelete(id);
  }

  async reorder(ids: string[], shopId: string): Promise<HomeSection[]> {
    const sections = await this.homeSectionsRepo.find({
      where: { shop: { id: shopId } },
    });

    const sectionsMap = new Map(sections.map((s) => [s.id, s]));

    const updatedSections: HomeSection[] = [];
    for (let i = 0; i < ids.length; i++) {
      const section = sectionsMap.get(ids[i]);
      if (section) {
        section.position = i;
        updatedSections.push(section);
      }
    }

    return this.homeSectionsRepo.save(updatedSections);
  }

  async toggleVisibility(id: string, shopId: string, isVisible: boolean): Promise<HomeSection> {
    const section = await this.homeSectionsRepo.findOne({
      where: { id, shop: { id: shopId } },
    });

    if (!section) {
      throw new Error('Home section not found');
    }

    section.isVisible = isVisible;
    return this.homeSectionsRepo.save(section);
  }
}

