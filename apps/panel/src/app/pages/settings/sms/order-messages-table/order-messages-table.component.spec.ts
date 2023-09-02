import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderMessagesTableComponent } from './order-messages-table.component';

describe('OrderMessagesTableComponent', () => {
  let component: OrderMessagesTableComponent;
  let fixture: ComponentFixture<OrderMessagesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderMessagesTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderMessagesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
