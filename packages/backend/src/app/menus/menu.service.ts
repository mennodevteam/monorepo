import { Menu, MenuCost, Product, ProductCategory } from '@menno/types';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service';
import fetch from 'node-fetch';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private menusRepo: Repository<Menu>,
    @InjectRepository(ProductCategory)
    private categoriesRepo: Repository<ProductCategory>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(MenuCost)
    private costsRepo: Repository<MenuCost>,
    private http: HttpService,
    private filesService: FilesService
  ) {}

  async sortProductCategories(list: number[]) {
    const categories: ProductCategory[] = [];
    for (let i = 0; i < list.length; i++) {
      categories.push(<ProductCategory>{
        id: <any>list[i],
        position: i,
      });
    }
    return await this.categoriesRepo.save(categories);
  }

  async sortProducts(list: string[]) {
    const products: Product[] = [];
    for (let i = 0; i < list.length; i++) {
      products.push(<Product>{
        id: list[i],
        position: i,
      });
    }

    return await this.productsRepo.save(products);
  }

  async syncMenu(menuId: string, prevCode: string, deleteCurrent = true) {
    const currentMenu = await this.menusRepo.findOne({
      where: { id: menuId },
      relations: ['categories.products', 'costs', 'costs.includeProductCategory', 'costs.includeProduct'],
    });

    if (deleteCurrent) {
      for (const cat of currentMenu.categories) {
        await this.categoriesRepo.softDelete({ id: cat.id });
      }
      for (const cost of currentMenu.costs) {
        await this.costsRepo.delete({ id: cost.id });
      }
    }

    const res = await this.http
      .get<{ menu: Menu }>(`https://new-admin-api.menno.ir/shops/complete-data/xmje/${prevCode}`)
      .toPromise();

    const menu = res.data.menu;

    for (const cat of menu.categories) {
      cat.menu = { id: menuId } as Menu;
      cat.deletedAt = null;
      if (cat.products) {
        for (const p of cat.products) {
          if (p.images && p.images[0]) {
            const binary = await fetch(`https://new-app-api.menno.ir/files/${p.images[0]}`);
            const blob = await binary.buffer();
            

            const savedImage: any = await this.filesService.upload(<any>{ buffer: blob }, p.id);
            p.images = [savedImage.key];
            p.deletedAt = null;
          }
        }
      }
      await this.categoriesRepo.save(cat);
    }
  }
}
