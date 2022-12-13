import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-image-selector-button',
  templateUrl: './image-selector-button.component.html',
  styleUrls: ['./image-selector-button.component.scss']
})
export class ImageSelectorButtonComponent implements OnInit {
  @Input() radius: boolean;
  constructor() { }

  ngOnInit(): void {
  }

}
