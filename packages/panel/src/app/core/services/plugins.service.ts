import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Plugin } from '@menno/types';
import { ShopPlugin } from '@menno/types';
import { Status } from '@menno/types';

@Injectable({
  providedIn: 'root'
})
export class PluginsService {
  private _plugins = new BehaviorSubject<ShopPlugin[]>(undefined);

  constructor(
    private http: HttpClient,
  ) {
    this.http.get('plugins').subscribe((plugins: ShopPlugin[]) => {
      this._plugins.next(plugins);
    })
  }

  get activePlugins(): Plugin[] {
    return this._plugins.value.filter(x => x.status === Status.Active && new Date(x.expiredAt).valueOf() > Date.now()).map(x => x.plugin);
  }

  get plugins(): Observable<ShopPlugin[]> {
    return new Observable((fn) => this._plugins.subscribe(fn));
  }

  isActive(plugin: Plugin): boolean {
    return this.activePlugins.indexOf(plugin) > -1;
  }
}
