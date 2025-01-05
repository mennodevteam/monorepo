import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasalamOAuth, Product } from '@menno/types';
import { HttpService } from '@nestjs/axios';
import { BasalamFilesService } from './basalam-files.service';
import { OauthService } from './oauth.service';

@Injectable()
export class BasalamProductService {
  constructor(
    @InjectRepository(BasalamOAuth)
    private readonly repo: Repository<BasalamOAuth>,
    private http: HttpService,
    private oauth: OauthService,
    private basalamFiles: BasalamFilesService,
  ) {}

  async updateProduct(shopId: string, productId: number, data: Partial<Product>) {
    const photos: number[] = [];
    if (data.imageFiles) {
      for (const image of Array.isArray(data.imageFiles) ? data.imageFiles : [data.imageFiles]) {
        const photo = await this.basalamFiles.uploadFile(shopId, image.md, 'product.photo');
        photos.push(photo.id);
      }
    }
    const dto = {
      name: data.title,
      photos,
      description: data.description,
    };

    return this.http
      .patch(`https://core.basalam.com/v3/products/${productId}`, dto, {
        headers: await this.oauth.getAuthorizationHeader(shopId),
      })
      .toPromise();
  }
}
