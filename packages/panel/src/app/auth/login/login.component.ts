import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { fadeIn } from '../../core/animations/fade.animation';
import { User } from '@menno/types';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    fadeIn(),
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string = '/';
  username: string;
  password: string;
  showPassword: boolean;
  user: User;
  token: string;
  step: 'username' | 'password' | 'token' = 'username';
  @ViewChild('usernameInput') usernameInput: ElementRef;
  @ViewChild('tokenInput') tokenInput: ElementRef;
  @ViewChild('passwordInput') passwordInput: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
    private auth: AuthService,
  ) {
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams.u && queryParams.p) {
      this.login(queryParams.u, queryParams.p, false);
    }
  }

  async checkUsername() {
    try {
      this.loading = true;
      this.user = await this.auth.init(this.username).toPromise();
      if (this.user) {
        if (this.user.password) {
          this.step = 'password';
          try {
            setTimeout(() => {
              this.passwordInput.nativeElement.focus();
            }, 200);
          } catch (error) { }
        } else if (this.user.mobilePhone) {
          this.sendToken();
        }
      }
      else {
      }
    } catch (error) {
      console.log(error);
      this.snack.open('نام کاربری یافت نشد', '', { panelClass: 'warning' });
      this.username = undefined;
    }
    this.loading = false;
  }

  async sendToken() {
    this.step = 'token';
    try {
      setTimeout(() => {
        this.tokenInput.nativeElement.focus();
      }, 200);
    } catch (error) {}
    await this.auth.sendSmsToken(this.username).toPromise();
  }

  login(username: string, password: string, saveLoginUser = true) {
    this.loading = true;
    this.auth.login(username, password, saveLoginUser)
      .pipe(first())
      .subscribe(
        data => {
          this.router.navigate([this.returnUrl], {
            replaceUrl: true,
          });
        },
        error => {
          console.log(error);
          if (error.status === 401) {
            this.snack.open('رمز ورود اشتباه است', '', {panelClass: 'warning'});
          }
          this.loading = false;
        });
  }

  ngOnInit() {
    setTimeout(() => {
      this.usernameInput.nativeElement.focus();
    }, 200);
  }
}
