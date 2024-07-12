import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { awsConfig } from './aws.config';
import 'multer';
import fetch from 'node-fetch';
import { Image } from '@menno/types';

@Injectable()
export class FilesService {
  private client = new S3(awsConfig);

  async uploadFromUrl(link: string, name: string, path?: string) {
    const binary = await fetch(link);
    const blob = await binary.buffer();
    return await this.upload(<any>{ buffer: blob }, name, path);
  }

  async upload(file: Express.Multer.File, name: string, path?: string) {
    // file.
    return new Promise((resolve, reject) => {
      let key = '';
      if (path) {
        key += path;
        if (!key.endsWith('/')) key += '/';
      }
      key += `${Date.now()}_${name.replace('/', '_')}`;
      this.client.upload(
        {
          Bucket: process.env.LIARA_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
        },
        {
          tags: [{ Key: 'abcd', Value: '12' }],
        },
        (err, data) => {
          if (err) reject(err);
          else resolve(data);
        },
      );
    });
  }

  getUrl(key: string) {
    return `https://${process.env.LIARA_BUCKET_NAME}.${process.env.LIARA_BUCKET_ENDPOINT}/${key}`;
  }

  async getImgproxyLinks(url: string, name: string, path?: string): Promise<Image> {
    const source = this.getUrl(url);
    const origin: any = await this.uploadFromUrl(
      `https://img.menno.pro/_/plain/${source}@webp`,
      `${name}_origin.webp`,
      path,
    );
    const md: any = await this.uploadFromUrl(
      `https://img.menno.pro/_/width:512/plain/${source}@webp`,
      `${name}_md.webp`,
      path,
    );
    const sm: any = await this.uploadFromUrl(
      `https://img.menno.pro/_/width:256/plain/${source}@webp`,
      `${name}_sm.webp`,
      path,
    );
    const xs: any = await this.uploadFromUrl(
      `https://img.menno.pro/_/width:128/plain/${source}@webp`,
      `${name}_xs.webp`,
      path,
    );
    const xxs: any = await this.uploadFromUrl(
      `https://img.menno.pro/_/width:64/plain/${source}@webp`,
      `${name}_xs.webp`,
      path,
    );
    return {
      origin: origin.key,
      md: md.key,
      sm: sm.key,
      xs: xs.key,
      xxs: xs.key,
    };
  }
}
