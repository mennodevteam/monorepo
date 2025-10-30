import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeliveryTypeDialogComponent } from './delivery-type-dialog.component';

describe('DeliveryTypeDialogComponent', () => {
  let component: DeliveryTypeDialogComponent;
  let fixture: ComponentFixture<DeliveryTypeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryTypeDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryTypeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

