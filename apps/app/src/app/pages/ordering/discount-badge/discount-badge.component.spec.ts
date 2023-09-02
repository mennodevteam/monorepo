import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountBadgeComponent } from './discount-badge.component';

describe('DiscountBadgeComponent', () => {
  let component: DiscountBadgeComponent;
  let fixture: ComponentFixture<DiscountBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscountBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
