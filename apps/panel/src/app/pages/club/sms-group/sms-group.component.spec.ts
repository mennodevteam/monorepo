import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmsGroupComponent } from './sms-group.component';

describe('SmsGroupComponent', () => {
  let component: SmsGroupComponent;
  let fixture: ComponentFixture<SmsGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SmsGroupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SmsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
