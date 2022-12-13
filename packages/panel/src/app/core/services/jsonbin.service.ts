import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FilterJsonbinDto } from '@menno/types';
import { Jsonbin } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class JsonbinService {
  constructor(private http: HttpClient) {}

  get(category: string): Promise<Jsonbin[]> {
    const dto = new FilterJsonbinDto();
    dto.category = category;
    return this.http.post<Jsonbin[]>(`jsonbin/filter`, dto).toPromise();
  }

  save(jsonbin: Jsonbin): Promise<Jsonbin> {
    return this.http.post<Jsonbin>(`jsonbin`, jsonbin).toPromise();
  }

  async remove(jsonbinId: string): Promise<void> {
    await this.http.delete(`jsonbin/${jsonbinId}`).toPromise();
  }
}
