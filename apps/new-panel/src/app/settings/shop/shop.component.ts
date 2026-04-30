import { Component, inject, signal } from '@angular/core';

import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BusinessCategory, Region, ShopContactLink, State } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { DialogService } from '../../core/services/dialog.service';
import { REGIONS } from '../../core/constants';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';

const CONTACT_LINK_TYPES = ['bale', 'telegram', 'eitaa', 'instagram', 'phone', 'map', 'whatsapp'] as const;
type ContactLinkType = (typeof CONTACT_LINK_TYPES)[number];

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatTooltipModule,
    FormsModule
],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent implements FormComponent {
  private readonly shopService = inject(ShopService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);
  readonly states = Region.states(REGIONS);
  readonly categories = Object.values(BusinessCategory);
  readonly contactLinkTypes = CONTACT_LINK_TYPES;
  selectedState = signal<State | undefined>(undefined);

  form = this.fb.group({
    title: [this.shopService.data()?.title, Validators.required],
    businessCategory: [this.shopService.data()?.businessCategory, Validators.required],
    description: [this.shopService.data()?.description],
    contactLinks: this.fb.array((this.shopService.data()?.contactLinks || []).map((item) => this.createContactLink(item))),
    address: [this.shopService.data()?.address],
    region: [this.getRegion()],
    latitude: [this.shopService.data()?.latitude],
    longitude: [this.shopService.data()?.longitude],
    logoImage: [(this.shopService.data()?.logoImage || this.shopService.data()?.logo) as any],
  });

  private getRegion() {
    const region = this.shopService.data()?.region
      ? REGIONS.find((item) => item.id === this.shopService.data()?.region?.id)
      : null;
    if (region) {
      const state = this.states.find((item) => item.title === region.state);
      this.selectedState.set(state);
    }
    return region;
  }

  editLogo() {
    this.dialog.imageCropper().then((res) => {
      if (res) {
        this.form.controls.logoImage.setValue(res);
        this.form.markAsDirty();
      }
    });
  }

  get contactLinks() {
    return this.form.controls.contactLinks;
  }

  private createContactLink(contactLink?: Partial<ShopContactLink>) {
    const type = ((contactLink as any)?.type || (contactLink as any)?.icon || this.contactLinkTypes[0]) as ContactLinkType;
    return this.fb.group({
      title: [contactLink?.title || ''],
      value: [contactLink?.value || ''],
      link: [contactLink?.link || ''],
      type: [type],
      star: [contactLink?.star || false],
    });
  }

  addContactLink() {
    this.contactLinks.push(this.createContactLink());
    this.form.markAsDirty();
  }

  removeContactLink(index: number) {
    this.contactLinks.removeAt(index);
    this.form.markAsDirty();
  }

  moveContactLink(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= this.contactLinks.length) return;
    const current = this.contactLinks.at(index);
    this.contactLinks.removeAt(index);
    this.contactLinks.insert(nextIndex, current);
    this.form.markAsDirty();
  }

  toggleContactLinkStar(index: number) {
    const control = this.contactLinks.at(index);
    const nextValue = !control.controls.star.value;
    control.controls.star.setValue(nextValue);
    this.form.markAsDirty();
  }

  onContactLinkTypeChange(index: number) {
    this.syncContactLink(index);
  }

  onContactLinkValueChange(index: number) {
    this.syncContactLink(index);
  }

  contactLinkPlaceholder(index: number): string {
    const type = this.contactLinks.at(index).controls.type.value as ContactLinkType;
    return this.linkPrefixByType(type);
  }

  testContactLink(index: number) {
    const link = (this.contactLinks.at(index).controls.link.value || '').trim();
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  private syncContactLink(index: number) {
    const control = this.contactLinks.at(index);
    const type = control.controls.type.value as ContactLinkType;
    const value = (control.controls.value.value || '').trim();
    const link = value ? `${this.linkPrefixByType(type)}${value}` : '';
    control.controls.link.setValue(link);
    this.form.markAsDirty();
  }

  private linkPrefixByType(type: ContactLinkType): string {
    switch (type) {
      case 'phone':
        return 'tel://';
      case 'telegram':
        return 'https://t.me/';
      case 'instagram':
        return 'https://instagram.com/';
      case 'whatsapp':
        return 'https://wa.me/';
      case 'map':
        return 'https://maps.google.com/?q=';
      case 'bale':
        return 'https://ble.ir/';
      case 'eitaa':
        return 'https://eitaa.com/';
      default:
        return '';
    }
  }

  canDeactivate() {
    return !this.form.dirty;
  }

  async submit() {
    const dto: any = this.form.getRawValue();
    if (dto.logoImage === null) dto.logo = null;
    try {
      this.form.markAsPristine();
      await this.shopService.saveMutation.mutateAsync(dto);
    } catch (error) {
      this.form.markAsDirty();
    }
  }
}
