import { HttpStatusCode } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiError } from '../../core/api-error';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'menno-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  returnUrl!: string;
  hide = true;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private snack: MatSnackBar
  ) {
    // redirect to home if already logged in
    // if (this.auth.user) {
    //   this.router.navigate(['/']);
    // }
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      save: [false],
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  async onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    const dto = this.loginForm.getRawValue();

    this.loading = true;
    try {
      await this.auth.login(dto.username, dto.password, dto.save).toPromise();
      this.router.navigate([this.returnUrl], {
        replaceUrl: true,
      });
    } catch (error: any) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case HttpStatusCode.Unauthorized:
            this.snack.open('username or password is incorrect', '', {
              duration: 1500,
            });
            break;

          default:
            break;
        }
        this.loading = false;
      }
    }
  }
}
