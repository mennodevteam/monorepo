import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { base64ToFile, ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-cropper-dialog',
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss'],
})
export class ImageCropperDialogComponent implements AfterViewInit {
  imageChangedEvent: any = '';
  result: any;
  @ViewChild('fileInput') fileInput: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) @Optional() public data: any,
    public dialogRef: MatDialogRef<any>
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.fileInput.nativeElement.click();
    }, 500);
  }

  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
  }
  imageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      const file = base64ToFile(event.base64);
      this.result = { base64: event.base64, file };
    }
  }
}
