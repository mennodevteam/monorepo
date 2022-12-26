import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'packages/panel/src/environments/environment';
import { map } from 'rxjs';
import { ShopService } from './shop.service';

const BASE_PATH = 'shops';
const API_PATH = 'files';

@Injectable({
  providedIn: 'root',
})
export class FilesService {
  constructor(private shopsService: ShopService, private http: HttpClient) {}

  upload(file: File, name: string): Promise<{ key: string; url: string } | undefined> {
    const formData = new FormData();
    formData.append('path', `${BASE_PATH}/${this.shopsService?.shop?.id}`);
    formData.append('name', name);
    formData.append('file', file);
    return this.http
      .post(`${API_PATH}/upload`, formData)
      .pipe(map((x: any) => ({ key: x.key, url: x.location })))
      .toPromise();
  }

  getFileUrl(key: string) {
    return `${environment.bucketUrl}/${key}`;
  }
}
