import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { HttpClient } from '@angular/common/http';
import { Order, Product, ProductCategory, ThirdPartyApp } from '@menno/types';
import { MenuService } from './menu.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../../shared/dialogs/alert-dialog/alert-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class HamiService {
  constructor(
    private shopService: ShopService,
    private http: HttpClient,
    private translate: TranslateService,
    private menu: MenuService,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {}

  get thirdParty() {
    return this.shopService.shop?.thirdParties?.find((x) => x.app === ThirdPartyApp.Hami);
  }

  async saveOrder(order: Order) {
    if (!order.thirdPartyId) {
      // const dto = {
      //   OrderId: Date.now(),
      //   BranchId: 
      // }
    }
  }

  async syncMenu() {
    const removeOthers = await this.dialog
      .open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('thirdParties.hami.syncDialog.title'),
          description: this.translate.instant('thirdParties.hami.syncDialog.description'),
          okText: this.translate.instant('thirdParties.hami.syncDialog.okText'),
          cancelText: this.translate.instant('thirdParties.hami.syncDialog.cancelText'),
        },
      })
      .afterClosed()
      .toPromise();
    if (this.thirdParty) {
      this.snack.open(this.translate.instant('thirdParties.hami.syncing'), '', { duration: 6000 });
      // handle categories
      let groups: GoodGroup[] | undefined;

      try {
        const groupsResponse = await this.makeRequest<{ GoodsGroup: GoodGroup[] }>(
          `/HamiOrder/GetGoodsGroup.aspx`
        );

        groups = groupsResponse?.GoodsGroup;
        if (groups) {
          const categories = this.menu.menu?.categories || [];
          for (const c of categories) {
            if (c.thirdPartyId) {
              const g = groups?.find((x) => x.GroupId.toString() === c.thirdPartyId);
              if (!g) await this.menu.deleteCategory(c.id);
              else {
                if (g.GroupName !== c.title) {
                  await this.menu.saveCategory({
                    id: c.id,
                    title: g.GroupName,
                  });
                }
              }
            } else if (removeOthers) await this.menu.deleteCategory(c.id);
          }

          for (const g of groups) {
            if (!categories.find((x) => x.thirdPartyId === g.GroupId.toString())) {
              await this.menu.saveCategory({
                thirdPartyId: g.GroupId.toString(),
                title: g.GroupName,
              });
            }
          }
        }
      } finally {
        if (!groups) {
          this.dialog.open(AlertDialogComponent, {
            data: {
              title: this.translate.instant('thirdParties.hami.syncDialog.connectionErrorTitle'),
              description: this.translate.instant('thirdParties.hami.syncDialog.connectionErrorDescription'),
              hideCancel: true,
              status: 'error',
            },
          });
          return;
        }
      }

      // handle products
      const goodsResponse = await this.makeRequest<{ Goods: Good[] }>(`/HamiOrder/GetGoods.aspx`);

      const goods = goodsResponse?.Goods;
      if (goods) {
        const products = this.menu.allProducts();
        for (const p of products) {
          if (p.thirdPartyId) {
            const g = goods?.find((x) => x.GoodsId.toString() === p.thirdPartyId);
            if (!g) await this.menu.deleteProduct(p.id);
            else {
              if (
                g.GoodsName !== p.title ||
                g.GoodsDescription !== p.description ||
                g.GoodsPrice !== p.price
              ) {
                await this.menu.saveProduct({
                  id: p.id,
                  title: g.GoodsName,
                  description: g.GoodsDescription,
                  price: g.GoodsPrice,
                });
              }
            }
          } else if (removeOthers) await this.menu.deleteProduct(p.id);
        }

        for (const g of goods) {
          if (!products.find((x) => x.thirdPartyId === g.GoodsId.toString())) {
            const cat = this.menu.menu?.categories?.find((x) => x.thirdPartyId === g.GoodsGroupId.toString());
            if (cat) {
              await this.menu.saveProduct({
                thirdPartyId: g.GoodsId.toString(),
                title: g.GoodsName,
                price: g.GoodsPrice,
                category: { id: cat.id } as ProductCategory,
              });
            }
          }
        }
      }

      this.dialog.open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('thirdParties.hami.syncDialog.completeTitle'),
          description: this.translate.instant('thirdParties.hami.syncDialog.completeDescription'),
          hideCancel: true,
          status: 'success',
        },
      });
    }
  }

  makeRequest<T>(path: string, data?: any) {
    const apiPath = this.thirdParty?.keys.apiPath;
    const token = this.thirdParty?.token;

    return new Promise<T>(function (resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open(data ? 'POST' : 'GET', `${apiPath}${path}?SecurityKey=${token}`);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        });
      };
      xhr.send(JSON.stringify(data));
    });
  }
}

interface GoodGroup {
  GroupId: number;
  GroupCode: number;
  GroupName: string;
  GroupColor: string;
  ParentGroupId: number;
  LastModificationDate: string;
}

interface Good {
  GoodsId: number;
  GoodsCode: number;
  GoodsName: string;
  GoodsColor: string;
  GoodsDescription: string;
  GoodsPrice: number;
  GoodsGroupId: string;
  PackingPrice: number;
  LastModificationDate: string;
}

const SAMPLE_GROUPS = {
  GoodsGroup: [
    {
      GroupId: 1,
      GroupCode: 1,
      GroupName: 'سوخاری',
      GroupColor: '#FFFFFFFF',
      ParentGroupId: 0,
      LastModificationDate: '5/29/2022 12:43:40 PM',
    },
    {
      GroupId: 2,
      GroupCode: 2,
      GroupName: 'پیش غذا',
      GroupColor: '#FFD99594',
      ParentGroupId: 0,
      LastModificationDate: '5/29/2022 12:43:45 PM',
    },
    {
      GroupId: 4,
      GroupCode: 3,
      GroupName: 'نوشیدنی',
      GroupColor: '#FFFFFFFF',
      ParentGroupId: 0,
      LastModificationDate: '5/29/2022 12:43:48 PM',
    },
  ],
};
const SAMPLE_GOODS = {
  Goods: [
    {
      GoodsId: 3,
      GoodsCode: 207,
      GoodsName: 'سالاد کلم چاکوچ',
      GoodsColor: '#FFD99594',
      GoodsDescription: '80 گرم سالاد کلم',
      GoodsPrice: 6700,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '5/9/2022 3:05:14 PM',
    },
    {
      GoodsId: 4,
      GoodsCode: 241,
      GoodsName: 'نان سیر مخصوص چاکوچ',
      GoodsColor: '#FFD99594',
      GoodsDescription: '4 عدد نان سیر چاکوچ',
      GoodsPrice: 20000,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 6:46:29 PM',
    },
    {
      GoodsId: 5,
      GoodsCode: 242,
      GoodsName: 'پک سیب زمینی چاکوچ با ادویه مخصوص',
      GoodsColor: '#FFD99594',
      GoodsDescription:
        '300 گرم سیب زمینی سرخ شده با ادویه مخصوص وچهارعدد سس ساشه دو عدد کچاپ و یک عدد فلفلی و یک عدد سس سیر',
      GoodsPrice: 39000,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 6:46:39 PM',
    },
    {
      GoodsId: 6,
      GoodsCode: 2500,
      GoodsName: 'بستنی شکلاتی آیس پک',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 15000,
      GoodsGroupId: '3',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 7,
      GoodsCode: 2501,
      GoodsName: 'بستنی شاتوت آیس پک',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 15000,
      GoodsGroupId: '3',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 8,
      GoodsCode: 104,
      GoodsName: 'پکیج نیمه اکونومی چاکوچ',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'نصف جوجه سوخاری به همراه سیب زمینی سرخ شده، یک عدد نان سیر،یک عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری و یک عدد سالاد کلم',
      GoodsPrice: 120000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 9,
      GoodsCode: 106,
      GoodsName: 'پکیج اکونومی چاکوچ',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'یک عدد جوجه سوخاری به همراه چهار عدد نان سیر،دو عدد سالاد کلم، سیب زمینی سرخ شده و دو عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری',
      GoodsPrice: 222000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 10,
      GoodsCode: 109,
      GoodsName: 'استریپس اکونومی 4 تکه',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '4 عدد فیله استریپس به همراه سیب زمینی سرخ شده و سس ساشه',
      GoodsPrice: 99000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 12,
      GoodsCode: 111,
      GoodsName: 'پکیج استریپس 7 تکه',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        '7 تکه فیله استریپس به همراه دو عدد نان سیر، سیب زمینی سرخ شده، دو عدد سالاد کلم، دو عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری',
      GoodsPrice: 178000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 3:23:05 PM',
    },
    {
      GoodsId: 13,
      GoodsCode: 112,
      GoodsName: 'پکیج چهار نفره رنسانس',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'یکی و نصف جوجه سوخاری به همراه دو عدد فیله استریپس، چهار عدد نان سیر، چهار عدد پیاز سوخاری، سیب زمینی سرخ شده، چهار عدد سالاد کلم، دو عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری',
      GoodsPrice: 349000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 14,
      GoodsCode: 209,
      GoodsName: 'پیاز سوخاری چاکوچ',
      GoodsColor: '#FFD99594',
      GoodsDescription: '7 عدد پیاز سوخاری به همراه یک عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری',
      GoodsPrice: 28000,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 3:45:58 PM',
    },
    {
      GoodsId: 15,
      GoodsCode: 2502,
      GoodsName: 'بستنی نسکافه آیس پک',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 15000,
      GoodsGroupId: '3',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 16,
      GoodsCode: 2503,
      GoodsName: 'بستنی شیر توت فرنگی آیس پک',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 15000,
      GoodsGroupId: '3',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 17,
      GoodsCode: 2504,
      GoodsName: 'بستنی پسته آیس پک',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 20000,
      GoodsGroupId: '3',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 18,
      GoodsCode: 2505,
      GoodsName: 'بستنی وانیل گردو آیس پک',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 20000,
      GoodsGroupId: '3',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:00 PM',
    },
    {
      GoodsId: 20,
      GoodsCode: 211,
      GoodsName: 'چیپس فلفلی باتو',
      GoodsColor: '#FFD99594',
      GoodsDescription: '',
      GoodsPrice: 2000,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '11/13/2021 7:39:08 AM',
    },
    {
      GoodsId: 21,
      GoodsCode: 212,
      GoodsName: 'چیپس فلفلی نمکی باتو',
      GoodsColor: '#FFD99594',
      GoodsDescription: '',
      GoodsPrice: 2000,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '11/13/2021 7:39:08 AM',
    },
    {
      GoodsId: 22,
      GoodsCode: 213,
      GoodsName: 'چیپس پنیری باتو',
      GoodsColor: '#FFD99594',
      GoodsDescription: '',
      GoodsPrice: 2000,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '11/13/2021 7:39:08 AM',
    },
    {
      GoodsId: 23,
      GoodsCode: 115,
      GoodsName: 'پکیج ایده آل دو نفره',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'چهار عدد فیله استریپس به همراه دو عدد فیله پنیری، سیب زمینی سرخ کرده، دو عدد نان سیر و دو عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری',
      GoodsPrice: 172000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 3:43:31 PM',
    },
    {
      GoodsId: 24,
      GoodsCode: 116,
      GoodsName: 'پکیج امضاء چاکوچ',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'نصف جوجه سوخاری به همراه 4 عدد فیله استریپس، سیب زمینی سرخ کرده، دو عدد نان سیر و دو عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری',
      GoodsPrice: 185000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '4/5/2022 5:50:01 PM',
    },
    {
      GoodsId: 25,
      GoodsCode: 117,
      GoodsName: 'پکیج سه نفره رنسانس',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'یک عدد جوجه کامل سوخاری،سه عدد فیله استریپس، سه عدد پیاز سوخاری، سیب زمینی سرخ شده، سه عدد نان سیر، سه عدد سالاد کلم و دو عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری',
      GoodsPrice: 299000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 3:43:54 PM',
    },
    {
      GoodsId: 26,
      GoodsCode: 118,
      GoodsName: 'فیله مخصوص پنیری',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'سه عدد فیله پنیری به همراه دو عدد نان سیر، سیب زمینی سرخ شده، یک عدد سالاد کلم و یک عدد سس قلمی کچاپ یا فلفلی به انتخاب مشتری',
      GoodsPrice: 139000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 3:44:40 PM',
    },
    {
      GoodsId: 27,
      GoodsCode: 119,
      GoodsName: 'فیله استریپس(اضافه)',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: 'یک عدد فیله استریپس',
      GoodsPrice: 18000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 3:44:17 PM',
    },
    {
      GoodsId: 28,
      GoodsCode: 120,
      GoodsName: 'فیله پنیری(اضافه)',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: 'یک عدد فیله پنیری',
      GoodsPrice: 29000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 3:45:06 PM',
    },
    {
      GoodsId: 32,
      GoodsCode: 304,
      GoodsName: 'سس چیلی تای چاکوچ',
      GoodsColor: '#FFC3D69B',
      GoodsDescription: '',
      GoodsPrice: 6000,
      GoodsGroupId: '5',
      PackingPrice: 0,
      LastModificationDate: '5/10/2022 12:15:07 PM',
    },
    {
      GoodsId: 35,
      GoodsCode: 230,
      GoodsName: 'فیله استریپس دو تکه',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: 'دو عدد فیله استریپس، سیب زمینی سرخ شده، یک عدد سس قلمی',
      GoodsPrice: 59000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '2/6/2022 7:00:39 PM',
    },
    {
      GoodsId: 36,
      GoodsCode: 121,
      GoodsName: 'پکیج پنیری دو تکه',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: 'دو عدد فیله پنیری به همراه سیب زمینی سرخ شده و یک عدد سس مخصوص چاکوچ',
      GoodsPrice: 89000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 3:45:33 PM',
    },
    {
      GoodsId: 37,
      GoodsCode: 900,
      GoodsName: 'نوشابه قوطی کوکاکولا',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '330میلی لیتر',
      GoodsPrice: 10000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 4:58:02 PM',
    },
    {
      GoodsId: 38,
      GoodsCode: 901,
      GoodsName: 'نوشابه قوطی فانتا پرتقالی',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '330 میلی لیتر',
      GoodsPrice: 10000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 4:58:47 PM',
    },
    {
      GoodsId: 39,
      GoodsCode: 902,
      GoodsName: 'نوشابه قوطی اسپرایت',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '330 میلی لیتر',
      GoodsPrice: 10000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 4:59:18 PM',
    },
    {
      GoodsId: 40,
      GoodsCode: 903,
      GoodsName: 'نوشابه قوطی کوکاکولا زیرو',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '330 میلی لیتر',
      GoodsPrice: 10000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 11:16:08 PM',
    },
    {
      GoodsId: 41,
      GoodsCode: 904,
      GoodsName: 'ماءالشعیر قوطی هی دی لیمو',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '330 میلی لیتر',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 4:26:38 PM',
    },
    {
      GoodsId: 42,
      GoodsCode: 905,
      GoodsName: 'ماءالشعیر قوطی هی دی هلو',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '330 میلی لیتر',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 4:27:43 PM',
    },
    {
      GoodsId: 43,
      GoodsCode: 906,
      GoodsName: 'ماءالشعیر قوطی هی دی استوایی',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '330 میلی لیتر',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 4:28:02 PM',
    },
    {
      GoodsId: 44,
      GoodsCode: 907,
      GoodsName: 'ماءالشعیر قوطی هی دی کلاسیک',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '330 میلی لیتر',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 4:29:52 PM',
    },
    {
      GoodsId: 45,
      GoodsCode: 917,
      GoodsName: 'آب معدنی کوچک',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 4000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:47:27 AM',
    },
    {
      GoodsId: 46,
      GoodsCode: 1006,
      GoodsName: 'نوشابه شیشه ای فرش دی بلوهاوایی',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:53:56 AM',
    },
    {
      GoodsId: 48,
      GoodsCode: 441,
      GoodsName: 'دوغ لیوانی',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 5000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '12/10/2021 9:02:20 PM',
    },
    {
      GoodsId: 49,
      GoodsCode: 1004,
      GoodsName: 'نوشابه شیشه ای فرش دی انگور قرمز',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:53:46 AM',
    },
    {
      GoodsId: 50,
      GoodsCode: 937,
      GoodsName: 'کالای حذف فاکتور 1',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 0,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/5/2022 2:45:06 PM',
    },
    {
      GoodsId: 52,
      GoodsCode: 952,
      GoodsName: 'نوشابه بطری کوکا',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 6000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:50:29 AM',
    },
    {
      GoodsId: 53,
      GoodsCode: 953,
      GoodsName: 'نوشابه بطری فانتا',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 6000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:50:38 AM',
    },
    {
      GoodsId: 54,
      GoodsCode: 954,
      GoodsName: 'نوشابه بطری اسپرایت',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 6000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:50:49 AM',
    },
    {
      GoodsId: 55,
      GoodsCode: 955,
      GoodsName: 'نوشابه بطری زیرو',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 6000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:51:10 AM',
    },
    {
      GoodsId: 56,
      GoodsCode: 911,
      GoodsName: 'نوشابه خانواده کوکاکولا',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 17500,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:46:59 AM',
    },
    {
      GoodsId: 57,
      GoodsCode: 1014,
      GoodsName: 'نوشابه شیشه ای فرش دی موهیتو',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:54:20 AM',
    },
    {
      GoodsId: 59,
      GoodsCode: 1027,
      GoodsName: 'نوشابه شیشه ای فرش دی پرتقال انبه',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 5:45:21 PM',
    },
    {
      GoodsId: 61,
      GoodsCode: 912,
      GoodsName: 'نوشابه خانواده فانتا',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 17500,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 5:21:58 PM',
    },
    {
      GoodsId: 62,
      GoodsCode: 913,
      GoodsName: 'نوشابه خانواده اسپرایت',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 17500,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:47:18 AM',
    },
    {
      GoodsId: 65,
      GoodsCode: 874,
      GoodsName: 'پنیر دیپ',
      GoodsColor: '#FFD99594',
      GoodsDescription: '',
      GoodsPrice: 28500,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '5/10/2022 12:13:39 PM',
    },
    {
      GoodsId: 66,
      GoodsCode: 122,
      GoodsName: 'پکیج سه تکه سوخاری',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'بالای ران یک عدد به همراه سینه یک عدد،ساق یک عدد،سیب زمینی سرخ کرده، نان برونچن ، سس ساشه',
      GoodsPrice: 99000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 4:10:25 PM',
    },
    {
      GoodsId: 67,
      GoodsCode: 124,
      GoodsName: 'پکیج سینوس چاکوچ',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: 'سینه یک عدد به همراه کتف و بال دو عدد،سیب زمینی سرخ کرده،نان برونچن،سس ساشه 4 عدد',
      GoodsPrice: 88000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 4:10:31 PM',
    },
    {
      GoodsId: 68,
      GoodsCode: 125,
      GoodsName: 'پکیج مرغ دو تکه سوخاری',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: 'سینه 1 عدد به همراه ساق 1 عدد،سیب زمینی سرخ کرده، نان برونچن ، سس ساشه 4 عدد',
      GoodsPrice: 78000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 4:10:37 PM',
    },
    {
      GoodsId: 69,
      GoodsCode: 126,
      GoodsName: 'پکیچ سه تیکه بال و کتف اسپایسی',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: 'کتف و بال سوخاری هرکدام 3عدد،به همراه سیب زمینی سرخ کرده،نان برونچن،سس ساشه 4 عدد',
      GoodsPrice: 74000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 4:10:43 PM',
    },
    {
      GoodsId: 70,
      GoodsCode: 127,
      GoodsName: 'پکیج عشق چاکوچ',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: 'فیله استریپس 2 عدد به همراه ساق دو عدد،سیب زمینی سرخ کرده،نان برونچن،سس ساشه 4 عدد',
      GoodsPrice: 109000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 4:10:48 PM',
    },
    {
      GoodsId: 71,
      GoodsCode: 128,
      GoodsName: 'پکیچ نفس چاکوچ',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription:
        'فیله پنیری یک عدد به همراه بالا ران یک عدد،سیب زمینی سرخ کرده،نان برونجن،سس ساشه 4عدد',
      GoodsPrice: 88000,
      GoodsGroupId: '1',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 4:10:56 PM',
    },
    {
      GoodsId: 72,
      GoodsCode: 239,
      GoodsName: 'قارچ سوخاری',
      GoodsColor: '#FFD99594',
      GoodsDescription: '',
      GoodsPrice: 35000,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 6:46:05 PM',
    },
    {
      GoodsId: 73,
      GoodsCode: 240,
      GoodsName: 'پاپ کرن',
      GoodsColor: '#FFD99594',
      GoodsDescription: '',
      GoodsPrice: 79000,
      GoodsGroupId: '2',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 6:46:22 PM',
    },
    {
      GoodsId: 132,
      GoodsCode: 320,
      GoodsName: 'نان بروچن',
      GoodsColor: '#FFC3D69B',
      GoodsDescription: '',
      GoodsPrice: 2000,
      GoodsGroupId: '5',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 7:42:12 PM',
    },
    {
      GoodsId: 181,
      GoodsCode: 942,
      GoodsName: 'ماءالشعیر هی دی قوطی سیب',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 5:45:06 PM',
    },
    {
      GoodsId: 183,
      GoodsCode: 958,
      GoodsName: 'نوشابه خانواده کوکاکولا زیرو',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 17500,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:51:20 AM',
    },
    {
      GoodsId: 188,
      GoodsCode: 997,
      GoodsName: 'نوشابه شیشه ای فرش دی لیموناد',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:53:31 AM',
    },
    {
      GoodsId: 201,
      GoodsCode: 1043,
      GoodsName: 'دوغ لیوانی خوشگوار',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 5500,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 11:43:04 PM',
    },
    {
      GoodsId: 231,
      GoodsCode: 1016,
      GoodsName: 'نوشابه شیشه ای فرش دی انبه',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/7/2022 10:54:44 AM',
    },
    {
      GoodsId: 237,
      GoodsCode: 1012,
      GoodsName: 'فرش دی خانواده موهیتو',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 14000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/4/2022 6:57:01 PM',
    },
    {
      GoodsId: 271,
      GoodsCode: 1028,
      GoodsName: 'نوشابه شیشه ای فرش دی انبه پشن فروت',
      GoodsColor: '#FFFFFFFF',
      GoodsDescription: '',
      GoodsPrice: 12000,
      GoodsGroupId: '4',
      PackingPrice: 0,
      LastModificationDate: '5/8/2022 11:40:53 PM',
    },
  ],
};
