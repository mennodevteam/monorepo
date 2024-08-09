import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiscountCouponModalComponent } from './discount-coupon-modal.component';

describe('DiscountCouponModalComponent', () => {
  let component: DiscountCouponModalComponent;
  let fixture: ComponentFixture<DiscountCouponModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiscountCouponModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscountCouponModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
