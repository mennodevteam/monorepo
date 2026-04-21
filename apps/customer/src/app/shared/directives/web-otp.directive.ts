import { Directive, ElementRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';

interface CredentialRequestOptions {
  otp: { transport: string[] };
  signal: AbortSignal;
}

@Directive({
  selector: '[webOtp]',
  standalone: true,
})
export class WebOtpDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLInputElement>);
  @Output() newOtp = new EventEmitter<string>();
  @Input() timeout?: number;

  private abortController = new AbortController();
  private timer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const options: CredentialRequestOptions = {
      otp: { transport: ['sms'] },
      signal: this.abortController.signal,
    };

    navigator.credentials
      .get(options as CredentialRequestOptions)
      .then((otp: unknown) => {
        const code = this.extractOtpCode(otp);
        if (!code) return;

        this.elementRef.nativeElement.value = code;
        this.newOtp.emit(code);
      })
      .catch(() => {
        // Intentionally ignored: Web OTP is best-effort.
      });

    if (this.timeout) {
      this.timer = setTimeout(() => {
        this.abortController.abort();
      }, this.timeout);
    }
  }

  ngOnDestroy(): void {
    this.abortController.abort();
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  private extractOtpCode(otp: unknown): string | undefined {
    if (!otp || typeof otp !== 'object' || !('code' in otp)) {
      return undefined;
    }

    const { code } = otp as { code?: unknown };
    return typeof code === 'string' ? code : undefined;
  }
}
