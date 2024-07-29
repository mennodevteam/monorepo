import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components/top-app-bar/top-app-bar.component';
import { ShopService } from '../../core';
declare let nmp_mapboxgl: any;

const DEFAULT_LOCATION = [51.389, 35.6892];
const API_KEY = 'web.3cdc9a4724a44c6a8bb12e00390bddd7';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, COMMON, TopAppBarComponent],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit {
  map: any;
  constructor(private shopService: ShopService) {}

  ngAfterViewInit(): void {
    let center = DEFAULT_LOCATION;
    const shop = this.shopService.shop;
    if (shop.latitude && shop.longitude) center = [shop.latitude, shop.longitude];
    else if (shop.region?.latitude && shop.region?.longitude)
      center = [shop.region.latitude, shop.region.longitude];

    this.map = new nmp_mapboxgl.Map({
      mapType: nmp_mapboxgl.Map.mapTypes.neshanVectorNight,
      container: 'map',
      zoom: 11,
      pitch: 0,
      center: [51.389, 35.6892],
      minZoom: 2,
      maxZoom: 21,
      trackResize: true,
      mapKey: API_KEY,
      poi: true,
      traffic: false,
      mapTypeControllerOptions: {
        show: false,
      },
    });

    navigator?.geolocation?.getCurrentPosition((position) => {
      this.map.flyTo({ center: [position.coords.longitude, position.coords.latitude], zoom: 18 });
    });
  }

  submit() {
    const center = this.map.getCenter();

    console.log(`${center.lat}, ${center.lng}`);
  }
}
