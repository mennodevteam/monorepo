import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { OauthService } from './oauth.service';
import { Readable } from 'stream';

export type FileType =
  | 'product.photo'
  | 'product.video'
  | 'user.avatar'
  | 'user.cover'
  | 'vendor.cover'
  | 'vendor.logo'
  | 'chat.photo'
  | 'chat.video'
  | 'chat.voice'
  | 'chat.file';

@Injectable()
export class BasalamFilesService {
  constructor(
    private http: HttpService,
    private oauth: OauthService,
  ) {}

  async uploadFile(shopId: string, link: string, type: FileType): Promise<any> {
    const fileResponse = await this.http
      .get(link, {
        responseType: 'stream',
      })
      .toPromise();

    const formData = new FormData();
    const buffer = await this.streamToBuffer(fileResponse.data);
    const blob = new Blob([buffer]);

    formData.append('file', blob, 'file');
    formData.append('file_type', type);

    const uploadResponse = await this.http.axiosRef.post('https://uploadio.basalam.com/v3/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(await this.oauth.getAuthorizationHeader(shopId)),
      },
    });
    return uploadResponse.data;
  }

  private streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
