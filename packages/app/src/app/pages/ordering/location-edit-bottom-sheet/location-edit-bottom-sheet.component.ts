import { Component, Inject, OnInit, Optional } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { icon, LatLng, latLng, Map, MapOptions, marker, Marker, tileLayer } from 'leaflet';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs/operators';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { Address, Region, Shop } from '@menno/types';

@Component({
  selector: 'app-location-edit-bottom-sheet',
  templateUrl: './location-edit-bottom-sheet.component.html',
  styleUrls: ['./location-edit-bottom-sheet.component.scss'],
})
export class LocationEditBottomSheetComponent implements OnInit {
  shop: Shop;
  noMoveYet = true;
  mapOptions: MapOptions = {
    layers: [
      tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' }),
    ],
    zoomControl: false,
    zoom: 15,
  };
  map?: Map;
  shopMarker: Marker;
  query: string;
  queryChanged: Subject<string> = new Subject<string>();
  showResults = false;
  searchControl = new FormControl();
  searchResults: BehaviorSubject<any> = new BehaviorSubject([]);
  address: string;
  saving = false;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA)
    @Optional()
    public data: {
      shop: Shop;
      center: [number, number];
    },
    private sheetRef: MatBottomSheetRef<any>,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (this.data && this.data.shop) {
      this.shop = this.data.shop;
      let shopCenter: LatLng | undefined = undefined;
      if (this.shop.latitude && this.shop.longitude) {
        shopCenter = latLng(this.shop.latitude, this.shop.longitude);
      } else if (this.shop.region && this.shop.region.latitude && this.shop.region.longitude) {
        shopCenter = latLng(this.shop.region.latitude, this.shop.region.longitude);
      }
      this.mapOptions.center = shopCenter
        ? latLng(shopCenter.lat + 0.002, shopCenter.lng + 0.002)
        : latLng(36.325342, 59.5181255);

      if (shopCenter) {
        this.shopMarker = marker([shopCenter.lat, shopCenter.lng], {
          icon: icon({
            iconSize: [50, 50],
            iconAnchor: [26, 50],
            iconUrl: 'assets/icons/shop-pin.png',
          }),
        });
      }
    }

    if (this.data && this.data.center) {
      this.mapOptions.center = latLng(this.data.center[0], this.data.center[1]);
    }

    if (!this.mapOptions.center) {
      this.mapOptions.center = latLng(36.308887, 59.537177);
    }

    this.searchControl.valueChanges
      .pipe(startWith(''))
      .pipe(debounceTime(500))
      .pipe(distinctUntilChanged())
      .subscribe((value) => {
        if (value) {
          this.search(value);
        } else {
          this.searchResults.next([]);
        }
      });
  }

  disableMap() {
    if (this.map) {
      this.map.dragging.disable();
      this.map.touchZoom.disable();
      this.map.doubleClickZoom.disable();
      this.map.scrollWheelZoom.disable();
      this.map.boxZoom.disable();
      this.map.keyboard.disable();
      if (this.map.tap) this.map.tap.disable();
    }
  }

  enableMap() {
    if (this.map && !this.map.dragging.enabled()) {
      this.map.dragging.enable();
      this.map.touchZoom.enable();
      this.map.doubleClickZoom.enable();
      this.map.scrollWheelZoom.enable();
      this.map.boxZoom.enable();
      this.map.keyboard.enable();
      if (this.map.tap) this.map.tap.enable();
    }
  }

  submit(): void {}

  onMapReady(map: Map): void {
    this.map = map;
  }

  queryChange(ev: string): void {
    this.queryChanged.next(ev);
  }

  async search(query: string): Promise<void> {
    this.query = query;
    const mapCenter: LatLng = <LatLng>this.map?.getCenter();
    const provider = new OpenStreetMapProvider({
      params: {
        'accept-language': 'ir',
        addressdetails: 1,
        limit: 5,
        viewbox: `${mapCenter.lng - 0.005},${mapCenter.lat - 0.005},${mapCenter.lng + 0.005},${
          mapCenter.lat + 0.005
        }`,
      },
    });
    if (this.shop && this.shop.region && this.shop.region) {
      query = this.shop.region.title + ' ' + query;
    }
    const results = await provider.search({ query });
    this.searchResults.next(results);
  }

  selectAddress(searchResult: any): void {
    this.searchControl.setValue('');
    if (this.map) this.map.panTo(latLng(searchResult.raw.lat, searchResult.raw.lon));
  }

  async save() {
    if (this.address && this.map) {
      const dto = new Address();
      const mapCenter = this.map.getCenter();
      dto.description = this.address;
      dto.latitude = mapCenter.lat;
      dto.longitude = mapCenter.lng;
      if (this.shop.region) dto.region = <Region>{ id: this.shop.region.id };
      const location = await this.http.post('addresses', dto).toPromise();
      this.sheetRef.dismiss(location);
    }
  }
}
