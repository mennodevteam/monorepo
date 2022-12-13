import { Injectable } from '@angular/core';

export class AppLocalConfig {
  defaultDailyOrderFilterType: 'table' | 'state' = 'state';
}

@Injectable({
  providedIn: 'root'
})
export class AppLocalConfigService {
  
  constructor() {
    
  }

  private get config(): AppLocalConfig {
    const localData = localStorage.getItem('panelConfig');
    if (localData) {
      return <AppLocalConfig>JSON.parse(localData);
    } else {
      return new AppLocalConfig();
    }
  }

  private set config(c: AppLocalConfig) {
    localStorage.setItem('panelConfig', JSON.stringify(c));
  }

  get defaultDailyOrderFilterType() {
    return this.config.defaultDailyOrderFilterType;
  }

  set defaultDailyOrderFilterType(v) {
    const config = this.config;
    config.defaultDailyOrderFilterType = v;
    this.config = config;
  }
}
