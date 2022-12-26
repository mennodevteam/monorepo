import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoBackDirective } from './directives/go-back.directive';
import { ImageLoaderDirective } from './directives/image-loader.directive';



@NgModule({
  declarations: [
    GoBackDirective,
    ImageLoaderDirective,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    GoBackDirective,
    ImageLoaderDirective,
  ]
})
export class SharedModule { }
