import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountCouponListPageComponent } from './discount-coupon-list-page.component';

describe('DiscountCouponListPageComponent', () => {
  let component: DiscountCouponListPageComponent;
  let fixture: ComponentFixture<DiscountCouponListPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountCouponListPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscountCouponListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
