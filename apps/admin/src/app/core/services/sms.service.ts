import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NewSmsDto, Sms } from '@menno/types';

const API_PATH = 'files';

@Injectable({
  providedIn: 'root',
})
export class SmsService {
  constructor(private http: HttpClient) {}

  send = (dto: NewSmsDto) => this.http.post<Sms[]>('sms/send', dto).toPromise();
}
