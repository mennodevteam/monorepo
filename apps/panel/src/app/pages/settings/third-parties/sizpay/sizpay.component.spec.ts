import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SizpayComponent } from './sizpay.component';

describe('SizpayComponent', () => {
  let component: SizpayComponent;
  let fixture: ComponentFixture<SizpayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SizpayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SizpayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
