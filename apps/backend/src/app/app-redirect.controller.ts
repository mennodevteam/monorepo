import { Controller, Get, HttpStatus, Param, Query, Redirect, Res } from '@nestjs/common';

import { Public } from './auth/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Shop, Status } from '@menno/types';
import { Repository } from 'typeorm';

const HOSTS = process.env.APP_REDIRECT_HOSTS?.split(',');

@Controller({
  host: HOSTS || '*.menno.ir',
})
export class AppRedirectController {
  constructor(
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>
  ) {}

  @Public()
  @Get(`:code`)
  async shop(@Res() res: any, @Param('code') code: string, @Query() query) {
    let table = ''
    if (!isNaN(Number(code)) && code.length === 5) {
      table = code.substring(3);
      code = code.substring(0, 3);
    }
    const shop = await this.shopsRepository.findOne({
      where: [
        {
          prevServerCode: code,
        },
        {
          prevServerUsername: code,
        },
      ],
    });
    const queryKeys = Object.keys(query);
    const queryParams = queryKeys.map((key) => `${key}=${encodeURIComponent(query[key])}`).join(`&`);
    if (shop) {
      let newLink = Shop.appLink(shop, process.env.APP_ORIGIN);
      if (queryParams) newLink += `?${queryParams}`;
      else if (table) newLink += `?table=${table}`
      res.redirect(newLink);
    } else {
      let prevLink = `${process.env.PREV_APP_URL}/${code}`;
      if (queryParams) prevLink += `?${queryParams}`;
      else if (table) prevLink += `?table=${table}`
      res.redirect(prevLink);
    }
  }
}
