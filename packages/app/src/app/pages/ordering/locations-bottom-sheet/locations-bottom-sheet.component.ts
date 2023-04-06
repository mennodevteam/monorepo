import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { Address } from '@menno/types';

@Component({
  selector: 'app-locations-bottom-sheet',
  templateUrl: './locations-bottom-sheet.component.html',
  styleUrls: ['./locations-bottom-sheet.component.scss'],
})
export class LocationsBottomSheetComponent implements OnInit {
  locations = new BehaviorSubject<Address[] | undefined>(undefined);

  constructor(private auth: AuthService, public sheetRef: MatBottomSheetRef<any>) {}

  async ngOnInit() {
    try {
      const locations = await this.auth.addresses;
      if (locations && locations.length > 0) {
        this.locations.next(locations);
      } else {
        this.sheetRef.dismiss(null);
      }
    } catch (error) {}
  }

  get loading() {
    return this.locations.value == undefined;
  }
}
