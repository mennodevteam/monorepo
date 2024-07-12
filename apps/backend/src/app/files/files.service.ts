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
      key += `${name.replace('/', '_')}`;
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
    const pre = Date.now();
    const originKey = `${pre}_${name}_origin.webp`;
    const mdKey = `${pre}_${name}_md.webp`;
    const smKey = `${pre}_${name}_sm.webp`;
    const xsKey = `${pre}_${name}_xs.webp`;
    const xxsKey = `${pre}_${name}_xxs.webp`;

    const save = async () => {
      const origin: any = await this.uploadFromUrl(
        `https://img.menno.pro/_/plain/${url}@webp`,
        originKey,
        path,
      );
      const md: any = await this.uploadFromUrl(
        `https://img.menno.pro/_/width:512/plain/${url}@webp`,
        mdKey,
        path,
      );
      const sm: any = await this.uploadFromUrl(
        `https://img.menno.pro/_/width:256/plain/${url}@webp`,
        smKey,
        path,
      );
      const xs: any = await this.uploadFromUrl(
        `https://img.menno.pro/_/width:128/plain/${url}@webp`,
        xsKey,
        path,
      );
      const xxs: any = await this.uploadFromUrl(
        `https://img.menno.pro/_/width:64/plain/${url}@webp`,
        xxsKey,
        path,
      );
    }

    save();

    return {
      origin: path ? `${path}/${originKey}` : originKey,
      md: path ? `${path}/${mdKey}` : mdKey,
      sm: path ? `${path}/${smKey}` : smKey,
      xs: path ? `${path}/${xsKey}` : xsKey,
      xxs: path ? `${path}/${xxsKey}` : xxsKey,
    };
  }
}
