import { PrintAction, PrintActionData, Shop, ShopPrinter, ShopPrintView, User } from '@menno/types';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { LoginUser } from '../auth/user.decorator';
import { AuthPayload } from '../core/types/auth-payload';
import { PrintersService } from './printers.service';
import { RedisKey, RedisService } from '../core/redis.service';

@Controller('printers')
export class PrintersController {
  constructor(
    @InjectRepository(Shop)
    private shopsRepo: Repository<Shop>,
    @InjectRepository(ShopPrinter)
    private shopPrintersRepo: Repository<ShopPrinter>,
    @InjectRepository(ShopPrintView)
    private printViewsRepo: Repository<ShopPrintView>,
    @InjectRepository(PrintAction)
    private printActionsRepo: Repository<PrintAction>,
    private printersService: PrintersService,
    private auth: AuthService,
    private redis: RedisService,
  ) {}

  @Public()
  @Get('login/:shopId')
  login(@Param('shopId') shopId: string): Promise<Shop> {
    return this.shopsRepo.findOneBy({ id: shopId });
  }

  @Post('printOrder')
  printOrder(@Body() dto): Promise<PrintAction[]> {
    return this.printersService.printOrder(dto);
  }

  @Post('printData/:printViewId')
  async printData(
    @Body() data: PrintActionData,
    @Param('printViewId') printViewId: string,
    @LoginUser() user: AuthPayload
  ): Promise<PrintAction> {
    const shop = await this.auth.getPanelUserShop(user);
    if (shop) return this.printersService.printData(data, printViewId, shop.id);
  }

  @Get('printViews')
  async findPrinterViewsByShopId(@LoginUser() user: AuthPayload): Promise<ShopPrintView[]> {
    const shop = await this.auth.getPanelUserShop(user);
    const printers = await this.shopPrintersRepo.find({
      where: { shop: { id: shop.id } },
      relations: ['printViews'],
    });
    return this.printViewsRepo.find({
      where: { printer: In(printers.map((x) => x.id)) },
      relations: ['printer'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  @Post('printViews')
  savePrintView(@Body() view: ShopPrintView): Promise<ShopPrintView> {
    return this.printViewsRepo.save(view);
  }

  @Public()
  @Get(':shopId')
  findPrintersByShopId(@Param('shopId') shopId: string): Promise<ShopPrinter[]> {
    return this.shopPrintersRepo.find({
      where: { shop: { id: shopId } },
      relations: ['printViews'],
    });
  }

  @Public()
  @Post()
  saveShopPrinter(@Body() shopPrinter: ShopPrinter): Promise<ShopPrinter> {
    return this.shopPrintersRepo.save(shopPrinter);
  }

  @Public()
  @Delete(':printerId')
  async removeShopPrinter(@Param('printerId') printerId: string): Promise<void> {
    await this.shopPrintersRepo.softDelete(printerId);
  }

  @Public()
  @Post('actions/filter')
  findPrintActionsByIds(@Body() ids: string[]): Promise<PrintAction[]> {
    return this.printActionsRepo.find({
      where: { id: In(ids) },
    });
  }

  @Public()
  @Get('actions/:shopId')
  async findPrintActionsByShopId(@Param('shopId') shopId: string): Promise<PrintAction[]> {
    const last5min = new Date();
    last5min.setMinutes(last5min.getMinutes() - 5);
    const redisKey = this.redis.key(RedisKey.PrintAction, shopId);
    const data = await this.redis.client.lrange(redisKey, 0, -1);
    let actions: PrintAction[] = data ? data.map(x => JSON.parse(x)) : [];
    actions = actions.filter((x) => !x.waitForLocal || Date.now() - new Date(x.createdAt).valueOf() > 15000);
    this.redis.client.del(redisKey);
    return actions;
  }

  @Public()
  @Get('actions/setPrinted/:id')
  async setPrintActionPrinted(@Param('id') id: string): Promise<void> {
    // await this.printActionsRepo.update(id, { isPrinted: true });
  }

  @Public()
  @Get('actions/setFailed/:id')
  async setPrintActionFailed(@Param('id') id: string): Promise<void> {
    // await this.printActionsRepo.increment({ id }, 'failedCount', 1);
  }

  @Delete('printViews/:viewId')
  async removePrintView(@Param('viewId') viewId: string): Promise<void> {
    await this.printViewsRepo.softDelete(viewId);
  }
}
