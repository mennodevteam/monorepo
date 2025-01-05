import { Body, Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { OauthService } from './oauth.service';
import { FilesService } from '../files/files.service';
import { BasalamFilesService } from './basalam-files.service';
import { Product } from '@menno/types';
import { BasalamProductService } from './basalam-product.service';

@Controller('basalam')
export class BasalamController {
  constructor(
    private readonly oauth: OauthService,
    private readonly filesService: FilesService,
    private readonly basalamFiles: BasalamFilesService,
    private readonly basalamProductsService: BasalamProductService,
  ) {}

  @Public()
  @Get('auth')
  async callback(@Query('code') code: string, @Query('state') state: string, @Req() req) {
    return this.oauth.callback(code, state);
  }

  @Public()
  @Get('uploadProductPhoto/:shopId/:imageKey')
  async uploadProductPhoto(@Param('shopId') shopId: string, @Param('imageKey') imageKey: string) {
    return this.basalamFiles.uploadFile(shopId, this.filesService.getUrl(imageKey), 'product.photo');
  }

  @Public()
  @Post('updateProduct/:shopId/:id')
  updateProduct(@Body() body: Partial<Product>, @Param('id') id: string, @Param('shopId') shopId: string) {
    return this.basalamProductsService.updateProduct(shopId, Number(id), body);
  }
}
