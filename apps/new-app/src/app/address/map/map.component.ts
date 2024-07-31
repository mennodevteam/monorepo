import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components/top-app-bar/top-app-bar.component';
import { ShopService } from '../../core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
declare let nmp_mapboxgl: any;

const DEFAULT_LOCATION = [51.389, 35.6892];

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, COMMON, TopAppBarComponent, MatToolbarModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  map: any;
  timeout: any
  constructor(
    private shopService: ShopService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.route.queryParams.subscribe((params) => {
      if (this.coordinate) {
        this.map?.setCenter([this.coordinate[1], this.coordinate[0]]);
        this.map?.setZoom(15);
      }
    });
  }

  ngAfterViewInit(): void {
    let center = DEFAULT_LOCATION;
    const shop = this.shopService.shop;

    if (this.coordinate) center = [this.coordinate[1], this.coordinate[0]];
    else if (shop.latitude && shop.longitude) center = [shop.longitude, shop.latitude];
    else if (shop.region?.latitude && shop.region?.longitude)
      center = [shop.region.longitude, shop.region.latitude];

    this.timeout = setTimeout(() => {
      this.map = new nmp_mapboxgl.Map({
        mapType: nmp_mapboxgl.Map.mapTypes.neshanVectorNight,
        container: 'map',
        zoom: this.coordinate ? 15 : 11,
        pitch: 0,
        center: center,
        minZoom: 2,
        maxZoom: 21,
        trackResize: true,
        mapKey: environment.neshanMapApiKey,
        poi: true,
        traffic: false,
        mapTypeControllerOptions: {
          show: false,
        },
      });

      if (!this.coordinate) {
        navigator?.geolocation?.getCurrentPosition((position) => {
          this.map.setCenter([position.coords.longitude, position.coords.latitude]);
          this.map.setZoom(15);
        });
      }
    }, 800);
  }

  get center() {
    return this.map?.getCenter();
  }

  async submit() {
    const params = { lat: this.center.lat, lng: this.center.lng };
    await this.router.navigate([], { queryParams: params, replaceUrl: true });
    this.router.navigate(['/address/edit'], { queryParams: params });
  }

  get coordinate() {
    const query = this.route.snapshot.queryParams;
    if (query['lat'] && query['lng']) return [Number(query['lat']), query['lng']];
    return;
  }

  ngOnDestroy(): void {
    if (this.timeout) clearTimeout(this.timeout);
}
}
