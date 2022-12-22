import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { awsConfig } from './aws.config';
import 'multer';

@Injectable()
export class FilesService {
  private client = new S3(awsConfig);

  async upload(file: Express.Multer.File, name: string, path?: string) {
    // file.
    return new Promise((resolve, reject) => {
      let key = '';
      if (path) {
        key += path;
        if (!key.endsWith('/')) key += '/';
      }
      key += `${Date.now()}_${name}`;
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
