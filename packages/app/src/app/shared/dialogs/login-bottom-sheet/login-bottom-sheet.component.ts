import { Component, ElementRef, Inject, OnDestroy, Optional, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatBottomSheet, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '@menno/types';

@Component({
  selector: 'login-bottom-sheet',
  templateUrl: './login-bottom-sheet.component.html',
  styleUrls: ['./login-bottom-sheet.component.scss'],
})
export class LoginBottomSheetComponent implements OnDestroy {
  mobileForm = new FormGroup({
    mobile: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });
  codeForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    code: new FormControl('', [Validators.required]),
  });
  timer = new BehaviorSubject<number | undefined>(undefined);
  timerTimeout: any;
  mobilePhone = new BehaviorSubject<string | undefined>(undefined);
  loading = false;
  abortController = new AbortController();
  isRegistered: boolean;

  @ViewChild('mobileInput') mobileInput: ElementRef;
  @ViewChild('codeInput') codeInput: ElementRef;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) @Optional() public data: any,
    private sheetRef: MatBottomSheetRef<LoginBottomSheetComponent>,
    private sheet: MatBottomSheet,
    public auth: AuthService,
    private translate: TranslateService,
    private snack: MatSnackBar
  ) {
    document.body.style.overflowY = 'hidden';
    try {
      if (this.auth.user?.extraInfo.mobilePhone) {
        this.mobileForm.get('mobile')?.setValue(this.auth.user.extraInfo.mobilePhone);

        if (this.data && this.data.autoSendToken) {
          this.sendToken();
        }
      }
    } catch (error) {}
  }

  ngOnInit(): void {
    this.timer.subscribe((value: number | undefined) => {
      if (value) {
        this.timerTimeout = setTimeout(() => {
          this.timer.next(value - 1);
        }, 1000);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.mobileInput.nativeElement.focus();
    }, 500);
    navigator.credentials
      .get(<any>{
        otp: { transport: ['sms'] },
        signal: this.abortController.signal,
      })
      .then((otp: any) => {
        if (this.mobilePhone.value) {
          try {
            this.codeForm.get('code')?.setValue(otp.code);
          } catch (error) {}
        }
      })
      .catch((err) => {});
  }

  async sendToken() {
    if (this.mobileForm.valid) {
      this.loading = true;
      let mobile = this.mobileForm.get('mobile')?.value;
      if (mobile) {
        if (mobile.length === 10 && mobile[0] === '9') mobile = `0${mobile}`;
        try {
          this.isRegistered = await this.auth.sendToken(mobile).toPromise();
          this.mobilePhone.next(mobile);
          this.loading = false;
          setTimeout(() => {
            if (this.isRegistered) this.codeInput.nativeElement.focus();
          }, 1000);
          this.timer.next(60);
        } catch (error) {}
      }
      this.loading = false;
    }
  }

  async sendAgain() {
    if (this.mobilePhone.value && this.timer.value === 0) {
      await this.auth.sendToken(this.mobilePhone.value).toPromise();
      this.timer.next(60);
    }
  }

  async login() {
    if (this.codeForm.valid) {
      const code = this.codeForm.get('code')?.value;
      if (code && this.mobilePhone.value) {
        this.loading = true;
        try {
          const user = await this.auth.loginWithToken(
            this.mobilePhone.value,
            code,
            !this.isRegistered
              ? ({
                  firstName: this.codeForm.get('firstName')?.value,
                  lastName: this.codeForm.get('lastName')?.value,
                } as User)
              : undefined
          );
          if (user) {
            this.sheetRef.dismiss(user);
            this.abortController.abort();
            if (!user.firstName) {
              setTimeout(() => {
                // this.sheet.open(UserEditBottomSheetComponent, {
                //   disableClose: true,
                // });
              }, 500);
            }
          } else {
            this.loading = false;
            this.codeForm.get('code')?.reset();
            this.snack.open(this.translate.instant('loginBottomSheet.incorrectCode'), '', {
              panelClass: 'warning',
            });
          }
        } catch (error) {
          this.loading = false;
          this.codeForm.get('code')?.reset();
          this.snack.open(this.translate.instant('loginBottomSheet.incorrectCode'), '', {
            panelClass: 'warning',
          });
        }
      }
    }
  }

  ngOnDestroy() {
    document.body.style.overflowY = 'auto';
    if (this.timerTimeout) {
      clearTimeout(this.timerTimeout);
    }
  }
}
