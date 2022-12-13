import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryArea } from '@menno/types';
import { Product } from '@menno/types';
import { ProductCategory } from '@menno/types';
import { Shop } from '@menno/types';
import { Status } from '@menno/types';
import { FileService } from './file.service';
import { MenuService } from './menu.service';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root'
})
export class DataMigrationService {

  constructor(
    private http: HttpClient,
    private menuService: MenuService,
    private fileService: FileService,
    private shop: ShopService,
    private snack: MatSnackBar,
  ) { }

  async syncMenu() {
    const prevServerCode = this.shop.instant.prevServerCode;
    if (!prevServerCode) return;
    const res: any = await this.http.get(`https://app-api.menno.ir/Restaurantmanager/GetRestaurantInfoByCode?restaurantCode=${prevServerCode}`).toPromise();
    let result = this.deserializeReferences(res, {}, []);
    let count = 0;
    for (const food of result.Data.FoodInfoes) {
      if (food.IsDeleted || food.FoodCategoryInfo.IsDeleted) continue;
      count++;
      this.snack.open(`درحال ذخیره سازی آیتم ${count} از ${result.Data.FoodInfoes.length}`, '', { duration: 10000 });
      let categories = this.menuService.instant.categories;
      let cat = categories.find(x => x.title.trim() === food.FoodCategoryInfo.Title.trim());
      if (!cat) {
        cat = (await this.menuService.saveCategories([<ProductCategory>{
          title: food.FoodCategoryInfo.Title.trim(),
          menu: { id: this.menuService.instant.id },
          status: food.FoodCategoryInfo.IsEnabled ? Status.Active : Status.Inactive,
          products: [],
        }]))[0];
      }


      const existProd = cat.products.find(x => x.title === food.Name);
      if (!existProd || new Date(existProd.createdAt).valueOf() < new Date(food.UpdatedDateTime).valueOf()) {
        let images: string[] = [];
        if (food.FileId) {
          try {
            let file = await this.saveFile(food.FileId, food.Name, 'product');
            images.push(file.id);
          } catch (error) {
          }
        }
        const p = await this.menuService.saveProduct(<Product>{
          id: existProd ? existProd.id : undefined,
          category: { id: cat.id },
          price: food.Price,
          title: food.Name,
          description: food.Description,
          status: existProd ? existProd.status : Status.Active,
          limitQuantity: food.InventoryCount != undefined || food.IsFinished,
          images,
        });
        if (p.limitQuantity) {
          this.menuService.setStockItemQuantity(p, food.IsFinished ? 0 : food.InventoryCount);
        }
      }
    }
  }

  async syncShop() {
    const prevServerCode = this.shop.instant.prevServerCode;
    if (!prevServerCode) return;
    const res: any = await this.http.get(`https://app-api.menno.ir/Restaurantmanager/GetRestaurantInfoByCode?restaurantCode=${prevServerCode}`).toPromise();
    let result = this.deserializeReferences(res, {}, []);
    const restaurant = result.Data;

    let logo: string;
    if (restaurant.FileId) {
      try {
        logo = (await this.saveFile(restaurant.FileId, restaurant.Name, 'logo')).id;
      } catch (error) { }
    }
    const phones: string[] = [];
    if (restaurant.Telephone) phones.push(restaurant.Telephone);
    if (restaurant.Telephone2) phones.push(restaurant.Telephone2);

    await this.shop.update(<Shop>{
      title: restaurant.Name,
      username: restaurant.CodeName,
      location: {
        latitude: restaurant.Latitude,
        longitude: restaurant.Longitude,
        address: restaurant.Address,
      },
      logo,
      phones,
      details: {
        description: restaurant.Description,
        instagram: restaurant.Instagram,
        tables: restaurant.RestaurantTableInfoes.filter(x => !x.IsDeleted).map(x => ({ code: x.Code, title: x.Title })),
      }
    });

    if (restaurant.RestaurantDeliveryPrices) {
      const existDeliveryArea = await this.http.get<DeliveryArea[]>('deliveryAreas').toPromise();
      for (const d of restaurant.RestaurantDeliveryPrices) {
        if (!existDeliveryArea.find(x => x.title === d.Title)) {
          this.http.post('deliveryAreas', <DeliveryArea>{
            polygon: JSON.parse(d.PolygonPointsJson),
            price: d.Price,
            status: d.IsDisabled ? Status.Inactive : Status.Active,
            title: d.Title,
            minOrderPrice: d.MinOrderPrice,
            minPriceForFree: d.MinPriceForFree,
          }).toPromise();
        }
      }
    }
  }

  private deserializeReferences<T>(obj: any, ids: {}, mappedObjects: Array<T>): any {
    var type = typeof obj;
    if (type == "string" || type == "number" || obj === Date || obj == null || obj == undefined) {
      return obj;
    }
    if (mappedObjects.indexOf(obj) >= 0 && !obj.$values) {
      return obj;
    }
    mappedObjects.push(obj);
    if (obj.$id) {
      if (obj.$values)
        ids[obj.$id] = obj.$values;
      else
        ids[obj.$id] = obj;
      delete obj.$id;
    }
    if (obj.$ref) {
      var ref = obj.$ref;
      obj = ids[obj.$ref];
      return obj;
    }
    if (obj instanceof Array) {
      var newArray = [];
      obj.forEach(x => {
        if (x.$ref) {
          x = ids[x.$ref];
          if (x) {
            newArray.push(x);
            delete x.$ref;
          }
        }
        else {
          newArray.push(this.deserializeReferences(x, ids, mappedObjects));
        }
      });
      return newArray;
    }
    else if (obj.$values) {
      var newArray = [];
      obj.$values.forEach(x => {
        if (x.$ref) {
          x = ids[x.$ref];
          if (x) {
            newArray.push(x);
            delete x.$ref;
          }
        }
        else {
          newArray.push(this.deserializeReferences(x, ids, mappedObjects));
        }
      });
      delete obj.$values;
      return newArray;
    }
    else {
      var properties = Object.getOwnPropertyNames(obj);
      for (var i = 0; i < properties.length; i++) {
        obj[properties[i]] = this.deserializeReferences(obj[properties[i]], ids, mappedObjects);
      }
    }

    return obj;
  }

  private dateParser(key, value) {
    if (typeof value === 'string') {
      var date = Date.parse(value);
      if (date && new Date(date).getFullYear() > 1790 && (value.indexOf('/') >= 0 || value.indexOf('-') >= 0) && value.indexOf("http") == -1) {
        //console.log("date not NaN: ", date, value);
        return new Date(date);
      }
    }
    return value;
  };

  async saveFile(id: number, title?: string, category?: string) {
    const fileBinary = await this.http.get(
      `https://app-api.menno.ir/FileManager/DownloadFile?fileId=${id}`,
      {
        responseType: 'blob',
      }
    ).toPromise();

    const file = await this.fileService.insertFile(fileBinary, title, category);
    return file;
  }
}
