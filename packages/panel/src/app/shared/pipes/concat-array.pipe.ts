import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'concatArray'
})
export class ConcatArrayPipe implements PipeTransform {

  transform(array: any[], sepprator: string = ','): string {
    try {
      return array.join(`${sepprator} `);
    } catch (error) {
      return '';
    }
  }

}
