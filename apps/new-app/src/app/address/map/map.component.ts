import { AfterViewInit, Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components/top-app-bar/top-app-bar.component';
import { ShopService, ThemeService } from '../../core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeMode } from '@menno/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import nmp_mapboxgl from '@neshan-maps-platform/mapbox-gl';

const DEFAULT_LOCATION: [number, number] = [51.389, 35.6892];

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, COMMON, TopAppBarComponent, MatToolbarModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  map: any;
  timeout: any;
  gpsLoading = signal(false);

  constructor(
    private shopService: ShopService,
    private router: Router,
    private route: ActivatedRoute,
    private theme: ThemeService,
    private snack: MatSnackBar,
    private translate: TranslateService,
  ) {
    this.route.queryParams.subscribe((params) => {
      setTimeout(() => {
        if (this.coordinate) {
          this.map?.setCenter([this.coordinate[1], this.coordinate[0]]);
          this.map?.setZoom(15);
        }
      }, 1000);
    });
  }

  ngAfterViewInit(): void {
    let center: [number, number] = DEFAULT_LOCATION;
    const shop = this.shopService.shop;

    if (this.coordinate) center = [this.coordinate[1], this.coordinate[0]];
    else if (shop.latitude && shop.longitude) center = [shop.longitude, shop.latitude];
    else if (shop.region?.latitude && shop.region?.longitude)
      center = [shop.region.longitude, shop.region.latitude];

    this.timeout = setTimeout(() => {
      this.map = new nmp_mapboxgl.Map({
        mapType:
          this.theme.mode === ThemeMode.Light
            ? nmp_mapboxgl.Map.mapTypes.neshanVector
            : nmp_mapboxgl.Map.mapTypes.neshanVectorNight,
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

      setTimeout(() => {
        if (!this.coordinate) {
          this.gotToGps();
        }
      }, 1000);
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
    if (query['lat'] && query['lng']) return [Number(query['lat']), Number(query['lng'])];
    return;
  }

  gotToGps() {
    this.gpsLoading.set(true);
    navigator?.geolocation?.getCurrentPosition(
      (position) => {
        this.map.setCenter([position.coords.longitude, position.coords.latitude]);
        this.map.setZoom(15);
        this.gpsLoading.set(false);
      },
      (error) => {
        this.snack.open(this.translate.instant('map.errorGps'), '', { duration: 3000 });
        this.gpsLoading.set(false);
      },
    );
  }

  ngOnDestroy(): void {
    if (this.timeout) clearTimeout(this.timeout);
  }
}
