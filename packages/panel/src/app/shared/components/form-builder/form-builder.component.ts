import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

export type FieldSection = {
  title?: string;
  description?: string;
  fields?: Field[];
};

export type Field = {
  type?: string;
  options?: { text: string; value: any }[];
  groups?: { text: string; options: { text: string; value: any }[] }[];
  optionsDisplayProperty?: string;
  label: string;
  hint?: string;
  ltr?: boolean;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  control: FormControl;
};

@Component({
  selector: 'form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss'],
})
export class FormBuilderComponent implements OnInit {
  @Input() sections: FieldSection[];
  @Input() i18n = true;

  constructor() {}

  ngOnInit(): void {}
}
