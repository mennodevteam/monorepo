import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalBankPosService {

  constructor(
    private http: HttpClient,
  ) { }

  pushAmount(amount: number) {
    this.http.post('http://127.0.0.1:8080/pcpos', {
      PR: "000000", AM: (amount*10).toString(), CU: "364", AD: "", PD: "1", ST: [""], AV: [""]
    }).toPromise();
  }
}
