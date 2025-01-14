import { Body, Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { OauthService } from './oauth.service';
import { FilesService } from '../files/files.service';
import { BasalamFilesService } from './basalam-files.service';
import { Product } from '@menno/types';
import { BasalamProductService } from './basalam-product.service';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { AuthService } from '../auth/auth.service';

@Controller('basalam')
export class BasalamController {
  constructor(
    private readonly auth: AuthService,
    private readonly oauth: OauthService,
    private readonly filesService: FilesService,
    private readonly basalamFiles: BasalamFilesService,
    private readonly basalamProductsService: BasalamProductService,
  ) {}

  @Public()
  @Get('auth')
  async callback(@Query('code') code: string, @Query('state') state: string, @Res() res) {
    await this.oauth.callback(code, state);
    res.redirect(`http://localhost:4200`);
  }

  @Get('uploadProductPhoto/:imageKey')
  async uploadProductPhoto(
    @Param('shopId') shopId: string,
    @Param('imageKey') imageKey: string,
    @LoginUser() user: AuthPayload,
  ) {
    const shop = await this.auth.getPanelUserShop(user);
    if (shop)
      return this.basalamFiles.uploadFile(shop.id, this.filesService.getUrl(imageKey), 'product.photo');
  }

  @Post('updateProduct/:id')
  updateProduct(@Body() body: Partial<Product>, @Param('id') id: string, @Param('shopId') shopId: string) {
    return this.basalamProductsService.updateProduct(shopId, Number(id), body);
  }

  @Get('products/list')
  async productList(@LoginUser() user: AuthPayload) {
    const shop = await this.auth.getPanelUserShop(user);
    if (shop) {
      return this.basalamProductsService.getProductList(shop.id);
    }
  }
}
