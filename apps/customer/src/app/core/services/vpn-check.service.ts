import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VpnCheckService {
  private readonly http = inject(HttpClient);
  private readonly vpnEnabled = signal(false);
  readonly isVpnEnabled = computed(() => this.vpnEnabled());

  constructor() {
    // Run in background and never block app startup.
    void this.checkVpnStatus();
  }

  private async checkVpnStatus() {
    try {
      const data = await firstValueFrom(
        this.http.get<{ country_code: string }>('https://api.ipbase.com/v1/json/').pipe(timeout(3000)),
      );
      this.vpnEnabled.set(data.country_code !== 'IR');
    } catch {
      // Skip on any error/timeouts and keep default false.
    }
  }
}
