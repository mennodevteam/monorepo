import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';

const BASE_URL = 'https://api.iran.liara.ir';

@Injectable()
export class LiaraService {
  constructor(private http: HttpService) {}
}
