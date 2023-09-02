import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';

const API_PATH = 'files';

@Injectable({
  providedIn: 'root',
})
export class FilesService {
  constructor(private http: HttpClient) {}

  upload(file: File, path: string, name: string): Promise<{ key: string; url: string } | undefined> {
    const formData = new FormData();
    formData.append('path', path);
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
