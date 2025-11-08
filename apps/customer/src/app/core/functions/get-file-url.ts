import { environment } from '../../../environments/environment';

export const getFileUrl = (key?: string | null): string => {
  if (!key) {
    return '';
  }

  if (key.startsWith('http')) {
    return key;
  }

  return `${environment.bucketUrl}/${key}`;
};


