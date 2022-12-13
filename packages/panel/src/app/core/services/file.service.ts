import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { File as MennoFile } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor(private http: HttpClient) {}

  getFileUrl(file: MennoFile | string) {
    if (typeof file === 'object') {
      let url = `${environment.apiUrl}files/${file.id}`;
      if (file.updatedAt) {
        url += `?version=${file.updatedAt.valueOf()}`;
      }
      return url;
    } else {
      return `${environment.apiUrl}files/${file}`;
    }
  }

  insertFile(file: any, title?: string, category?: string): Promise<MennoFile> {
    file = new File([file], `${title || 'sample'}.jpg`, { type: 'image/jpeg' });
    const formDate = new FormData();
    formDate.append('file', file);
    formDate.append('title', title);
    formDate.append('category', category);
    return this.http.post<MennoFile>('files', formDate).toPromise();
  }

  updateFile(
    fileId: string,
    file: any,
    title?: string,
    category?: string
  ): Promise<MennoFile> {
    file = new File([file], `${title || 'sample'}.jpg`, { type: 'image/jpeg' });
    const formDate = new FormData();
    formDate.append('file', file);
    formDate.append('title', title);
    formDate.append('category', category);
    return this.http.put<MennoFile>(`files/${fileId}`, formDate).toPromise();
  }
}
