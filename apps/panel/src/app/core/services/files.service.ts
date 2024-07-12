import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';
import { ShopService } from './shop.service';
import { Image } from '@menno/types';

const API_PATH = 'files';

@Injectable({
  providedIn: 'root',
})
export class FilesService {
  constructor(
    private shopsService: ShopService,
    private http: HttpClient,
  ) {}

  upload(file: File, name: string): Promise<{ key: string; url: string } | undefined> {
    const formData = new FormData();
    formData.append('path', `${this.shopsService?.shop?.code}`);
    formData.append('name', name);
    formData.append('file', file);
    return this.http
      .post(`${API_PATH}/upload`, formData)
      .pipe(map((x: any) => ({ key: x.key, url: x.location })))
      .toPromise();
  }

  saveFileImage(key: string, name: string) {
    return this.http
      .post<Image>(`${API_PATH}/upload/v2`, {
        url: this.getFileUrl(key),
        name,
        path: `${this.shopsService?.shop?.code}`,
      })
      .toPromise();
  }

  getFileUrl(key: string) {
    return `${environment.bucketUrl}/${key}`;
  }
}
