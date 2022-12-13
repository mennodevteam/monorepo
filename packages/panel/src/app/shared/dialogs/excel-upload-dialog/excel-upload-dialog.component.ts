import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-excel-upload-dialog',
  templateUrl: './excel-upload-dialog.component.html',
  styleUrls: ['./excel-upload-dialog.component.scss']
})
export class ExcelUploadDialogComponent implements AfterViewInit {
  fileChangedEvent: any = '';
  @ViewChild('fileInput') fileInput: ElementRef;
  constructor() { }

  ngAfterViewInit(): void {
    this.fileInput.nativeElement.click();
  }

  changeFileInput(e: any) {
    const files = e.target.files, f = files[0];
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const data = new Uint8Array(e.target.result);
      const ws = XLSX.read(data, { type: 'array' });
      const sheet = ws.Sheets[ws.SheetNames[0]];
      const header: string[] = XLSX.utils.sheet_to_json(sheet, { range: 1, header: "A" });
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { range: 1, header: "A" });
      console.log(json);
    };
    reader.readAsArrayBuffer(f);
  }
}
