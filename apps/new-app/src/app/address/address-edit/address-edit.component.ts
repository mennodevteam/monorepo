import { AfterViewInit, Component, computed, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';
import { MatToolbarModule } from '@angular/material/toolbar';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Address, DeliveryArea, Region, State, ThemeMode } from '@menno/types';
import { AddressesService, CartService, REGIONS, ShopService, ThemeService } from '../../core';
import nmp_mapboxgl from '@neshan-maps-platform/mapbox-gl';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-address-edit',
  standalone: true,
  imports: [
    CommonModule,
    COMMON,
    TopAppBarComponent,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './address-edit.component.html',
  styleUrl: './address-edit.component.scss',
})
export class AddressEditComponent implements AfterViewInit, OnDestroy {
  addressForm: FormGroup;
  address?: Address;
  saving = signal<boolean>(false);
  loading = signal<boolean>(false);
  timeout: any;
  deliveryArea?: DeliveryArea;
  states = Region.states(REGIONS);
  regionState = signal<State | null>(null);
  regions = computed(() => {
    const state = this.regionState();
    return state?.regions || [];
  });
  @ViewChild('regionStateElem') regionStateElem: MatSelect;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: PlatformLocation,
    private shopService: ShopService,
    private cart: CartService,
    private addressesService: AddressesService,
    private theme: ThemeService,
    private http: HttpClient,
  ) {
    this.address = this.router.getCurrentNavigation()?.extras?.state?.['address'];
    if (!this.coordinate && this.address) this.location.back();
    else {
      this.deliveryArea = this.router.getCurrentNavigation()?.extras?.state?.['deliveryArea'];
      if (!this.deliveryArea) {
        this.http
          .get<DeliveryArea>(
            `deliveryAreas/${this.shopService.shop.id}/${this.coordinate?.[0]}/${this.coordinate?.[1]}`,
          )
          .subscribe((delivery) => {
            this.deliveryArea = delivery;
          });
      }

      this.addressForm = new FormGroup({
        region: new FormControl(this.address?.region),
        title: new FormControl(this.address?.title, Validators.required),
        description: new FormControl(this.address?.description, Validators.required),
        postalCode: new FormControl(this.address?.postalCode),
        latitude: new FormControl(this.coordinate?.[0], Validators.required),
        longitude: new FormControl(this.coordinate?.[1], Validators.required),
      });
      this.findAndSetRegion();
    }
  }

  ngAfterViewInit(): void {
    this.timeout = setTimeout(() => {
      new nmp_mapboxgl.Map({
        mapType:
          this.theme.mode === ThemeMode.Light
            ? nmp_mapboxgl.Map.mapTypes.neshanVector
            : nmp_mapboxgl.Map.mapTypes.neshanVectorNight,
        container: 'map',
        zoom: 15,
        pitch: 0,
        center: [this.coordinate?.[1] || 0, this.coordinate?.[0] || 0],
        trackResize: true,
        mapKey: environment.neshanMapApiKey,
        dragPan: false,
        poi: true,
        traffic: false,

        mapTypeControllerOptions: {
          show: false,
        },
      });
    }, 800);
  }

  findAndSetRegion() {
    if (this.coordinate) {
      this.loading.set(true);
      this.addressForm.disable();
      const [lat, lng] = this.coordinate;
      this.http
        .get<any>(`https://api.neshan.org/v5/reverse?lat=${lat}&lng=${lng}`, {
          headers: {
            'Api-Key': environment.neshanSearchApiKey,
          },
        })
        .subscribe(
          (data) => {
            const sortedRegions: Region[] = [...REGIONS];
            sortedRegions.sort(
              (a, b) =>
                Region.haversine({ latitude: lat, longitude: lng } as Region, a) -
                Region.haversine({ latitude: lat, longitude: lng } as Region, b),
            );

            const region = sortedRegions.find((x) => x.title === data.city);
            if (region) {
              this.addressForm.get('region')?.setValue(region);
              const state = this.states.find((x) => x.title === region.state);
              if (state) {
                this.regionState.set(state);
                if (this.regionStateElem) this.regionStateElem.value = state;
              }
            }
            let description: string = data.formatted_address;
            description = description.replace(`${data.city}، `, '');
            this.addressForm.get('description')?.setValue(description);
          },
          (err) => {
            //unhandled
          },
          () => {
            this.loading.set(false);
            this.addressForm.enable();
          },
        );
    }
  }

  get coordinate() {
    if (this.address) return [this.address.latitude, this.address.longitude];
    const query = this.route.snapshot.queryParams;
    if (query['lat'] && query['lng']) return [Number(query['lat']), Number(query['lng'])];
    return;
  }

  get dto() {
    const dto: Address = this.addressForm.getRawValue();
    if (this.address) dto.id = this.address.id;
    if (this.deliveryArea) dto.deliveryArea = { id: this.deliveryArea.id } as DeliveryArea;
    return dto;
  }

  async submit() {
    if (!this.addressForm.valid) return;
    this.saving.set(true);
    const address = await this.addressesService.save(this.dto);
    if (address) this.cart.address.set(address);
    window.history.go(-2);
  }

  ngOnDestroy(): void {
    if (this.timeout) clearTimeout(this.timeout);
  }
}
