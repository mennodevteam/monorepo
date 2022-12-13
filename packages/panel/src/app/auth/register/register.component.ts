import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Region } from '@menno/types';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  environment = environment;
  form: FormGroup;
  loading = false;
  regions: Region[];
  constructor(
    private router: Router,
    private http: HttpClient,
    private snack: MatSnackBar,
  ) {
  }

  async ngOnInit() {
    try {
      this.regions = await this.http.get<Region[]>('regions').toPromise() || [];
    } catch (error) {
      this.regions = [];
    }
    this.form = new FormGroup({
      title: new FormControl('', [Validators.required]),
      prevServerCode: new FormControl(''),
      username: new FormControl('', [Validators.required]),
      regionId: new FormControl(this.regions && this.regions.length ? this.regions[0] : -1),
      regionTitle: new FormControl(''),
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [Validators.required]),
      loginUsername: new FormControl('', [Validators.required]),
      loginPassword: new FormControl('', [Validators.required]),
      mobilePhone: new FormControl(''),
      pluginKey0: new FormControl(undefined),
      pluginKey1: new FormControl(undefined),
      pluginKey2: new FormControl(undefined),
      pluginKey3: new FormControl(undefined),
      pluginKey4: new FormControl(undefined),
      pluginKey5: new FormControl(undefined),
      pluginKey6: new FormControl(undefined),
      pluginKey7: new FormControl(undefined),
      pluginKey8: new FormControl(undefined),
      pluginKey9: new FormControl(undefined),
      pluginKey10: new FormControl(undefined),
      pluginKey11: new FormControl(undefined),
    })
  }

  async save() {
    if (this.form.valid) {
      this.loading = true;
      const formVal = this.form.value;
      if (formVal.regionId != -1) formVal.regionTitle = undefined;
      else formVal.regionId = undefined;
      if (formVal.prevServerCode) {
        formVal.code = formVal.prevServerCode;
      }

      formVal.pluginKeys = [
        formVal.pluginKey0,
        formVal.pluginKey1,
        formVal.pluginKey2,
        formVal.pluginKey3,
        formVal.pluginKey4,
        formVal.pluginKey5,
        formVal.pluginKey6,
        formVal.pluginKey7,
        formVal.pluginKey8,
        formVal.pluginKey9,
        formVal.pluginKey10,
        formVal.pluginKey11,
      ];

      try {
        const shop = await this.http.post('shops', formVal).toPromise();
        console.log(shop);
        this.router.navigateByUrl('/auth/login');
      } catch (error) {
        this.snack.open(error.message, '', { panelClass: 'error' });
        this.loading = false;
      }
    }
  }
}
