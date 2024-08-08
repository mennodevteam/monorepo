import { AfterViewInit, Component, OnDestroy, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';
import { MatToolbarModule } from '@angular/material/toolbar';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Address, ThemeMode } from '@menno/types';
import { AddressesService, CartService, ShopService, ThemeService } from '../../core';
declare let nmp_mapboxgl: any;

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
    ReactiveFormsModule,
  ],
  templateUrl: './address-edit.component.html',
  styleUrl: './address-edit.component.scss',
})
export class AddressEditComponent implements AfterViewInit, OnDestroy {
  addressForm: FormGroup;
  address?: Address;
  saving = signal<boolean>(false);
  timeout: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: PlatformLocation,
    private shopService: ShopService,
    private cart: CartService,
    private addressesService: AddressesService,
    private theme: ThemeService,
  ) {
    this.address = this.router.getCurrentNavigation()?.extras?.state?.['address'];
    if (!this.coordinate) this.location.back();

    this.addressForm = new FormGroup({
      title: new FormControl(this.address?.title, Validators.required),
      description: new FormControl(this.address?.description, Validators.required),
      latitude: new FormControl(this.coordinate?.[0], Validators.required),
      longitude: new FormControl(this.coordinate?.[1], Validators.required),
    });
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
        center: [this.coordinate?.[1], this.coordinate?.[0]],
        trackResize: true,
        mapKey: environment.neshanMapApiKey,
        dragPin: false,
        poi: true,
        traffic: false,

        mapTypeControllerOptions: {
          show: false,
        },
      });
    }, 800);
  }

  get coordinate() {
    if (this.address) return [this.address.latitude, this.address.longitude];
    const query = this.route.snapshot.queryParams;
    if (query['lat'] && query['lng']) return [Number(query['lat']), query['lng']];
    return;
  }

  get dto() {
    const dto: Address = this.addressForm.getRawValue();
    if (this.address) dto.id = this.address.id;
    return dto;
  }

  async submit() {
    if (!this.addressForm.valid) return;
    this.saving.set(true);
    const address = await this.addressesService.save(this.dto);
    if (address) this.cart.address.set(address);
    this.location.back();
    this.location.back();
  }

  ngOnDestroy(): void {
    if (this.timeout) clearTimeout(this.timeout);
  }
}
