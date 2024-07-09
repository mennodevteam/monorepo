import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderTypeBottomSheetComponent } from './order-type-bottom-sheet.component';

describe('OrderTypeBottomSheetComponent', () => {
  let component: OrderTypeBottomSheetComponent;
  let fixture: ComponentFixture<OrderTypeBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderTypeBottomSheetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderTypeBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
