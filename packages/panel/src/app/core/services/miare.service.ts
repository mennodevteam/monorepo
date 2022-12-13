import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Order } from '@menno/types';
import { User } from '@menno/types';
import { environment } from '@env/environment';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { FileService } from './file.service';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root'
})
export class MiareService {
  private miareHttpHeaders: HttpHeaders;

  constructor(
    private http: HttpClient,
    private shop: ShopService,
    private filesService: FileService,
    private snack: MatSnackBar,
    private translate: TranslateService,
  ) {
    this.miareHttpHeaders = new HttpHeaders({
      'Authorization': `Token ${this.shop.instant.deliveryAccountId}`,
      'Content-Type': 'application/json',
    })
  }

  private get accountingBaseUrl() {
    return environment.production ? "https://www.mia.re/api/accounting" : "https://www.staging.mia.re/api/accounting";
  }

  private get deliveryBaseUrl() {
    return environment.production ? "https://ws.mia.re/trip-management/third-party-api/v2" : "https://staging.ws.mia.re/trip-management/third-party-api/v2";
  }

  estimatePrice(source: string, destination: string): Promise<number> {
    return this.http.get<any>(`${this.accountingBaseUrl}/estimate/price/?source=${source}&destination=${destination}`, {
      headers: this.miareHttpHeaders,
    }).pipe(map(x => x.price)).toPromise();
  }

  async createTripForOrder(order: Order, deadLineInMinute: number) {
    const shop = this.shop.instant;
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + deadLineInMinute);
    try {
      const trip = await this.http.post(`${this.deliveryBaseUrl}/trips`, {
        "pickup": {
          "name": shop.title,
          "phone_number": shop.phones[0],
          "address": shop.location.address,
          "image": this.filesService.getFileUrl(shop.logo),
          "location": {
            "latitude": Number(shop.location.latitude),
            "longitude": Number(shop.location.longitude)
          },
          "deadline": deadline,
        },
        "courses": [
          {
            "bill_number": order.qNumber.toString(),
            "name": User.fullName(order.customer),
            "phone_number": order.customer.mobilePhone,
            "address": order.details.address,
            "location": {
              "latitude": Number(order.details.latitude),
              "longitude": Number(order.details.longitude)
            },
            "manifest_items": order.items.filter(x => !x.isAbstract).map(x => ({
              name: x.title,
              quantity: x.quantity,
            }))
          }
        ]
      }, {
        headers: this.miareHttpHeaders,
      }).toPromise();
      this.snack.open(this.translate.instant('miare.createdSuccessfully'), '', { panelClass: 'success' });
    } catch (er) {
      switch (er.error.code) {
        case "no_area":
          this.snack.open(this.translate.instant('miare.noAreaError'), '', { panelClass: 'warning' });
          break;
        case "concurrency_limit":
          this.snack.open(this.translate.instant('miare.concurrencyLimitError'), '', { panelClass: 'warning' });
          break;
        default:
          this.snack.open(er.error.code, '', { panelClass: 'error' });
          console.log(er.error);
          break;
      }
      throw new Error(er);
    }
  }

  async listTrips(): Promise<any[]> {
    const lastH = new Date();
    lastH.setHours(lastH.getHours() - 3);
    return this.http.get<any>(`${this.deliveryBaseUrl}/trips/?from_datetime=${lastH.toJSON()}`, {
      headers: this.miareHttpHeaders,
    }).pipe(map(x => x.data)).toPromise();
  }

  async cancelTrip(tripId: string) {
    try {
      const trip = await this.http.post(`${this.deliveryBaseUrl}/trips/${tripId}/cancel/`, null, {
        headers: this.miareHttpHeaders,
      }).toPromise();
    } catch (er) {
      switch (er.error.code) {
        case "canceling_after_deadline":
        case "canceling_arrived_trip":
        case "canceling_ended_trip":
        case "invalid_state_change":
          this.snack.open(this.translate.instant('miare.cancelError'), '', { panelClass: 'warning' });
          break;
        default:
          this.snack.open(er.error.code, '', { panelClass: 'error' });
          console.log(er.error);
          break;
      }
      throw new Error(er);
    }
  }
}
