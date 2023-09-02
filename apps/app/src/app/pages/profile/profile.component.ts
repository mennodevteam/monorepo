import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { GenderType } from '@menno/types';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  profileForm: FormGroup;
  GenderType = GenderType;

  constructor(private fb: FormBuilder, private auth: AuthService) {
    if (this.user) this.init();
    else
      this.auth.userObservable.subscribe((user) => {
        if (user) this.init();
      });
  }

  init() {
    this.profileForm = this.fb.group({
      firstName: [this.user?.firstName, Validators.required],
      lastName: [this.user?.lastName, Validators.required],
      gender: [this.user?.gender || GenderType.Male],
      birthDate: [this.user?.birthDate],
      isMarried: [this.user?.marriageDate ? true : false],
      marriageDate: [this.user?.marriageDate],
      address: [this.user?.address],
    });
  }

  get user() {
    return this.auth.user;
  }

  submit() {
    if (this.profileForm.invalid) return;
    const fv = this.profileForm.getRawValue();
    if (!fv.isMarried) fv.marriageDate = null;
    this.auth.update(fv);
  }
}
