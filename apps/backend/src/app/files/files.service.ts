import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { awsConfig } from './aws.config';
import 'multer';
import fetch from 'node-fetch';

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
        }
      );
    });
  }
}
