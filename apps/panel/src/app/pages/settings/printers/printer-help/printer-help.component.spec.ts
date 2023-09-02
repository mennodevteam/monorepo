import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrinterHelpComponent } from './printer-help.component';

describe('PrinterHelpComponent', () => {
  let component: PrinterHelpComponent;
  let fixture: ComponentFixture<PrinterHelpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrinterHelpComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PrinterHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
