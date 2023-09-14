import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShopInfoModalComponent } from './shop-info-modal.component';

describe('ShopInfoModalComponent', () => {
  let component: ShopInfoModalComponent;
  let fixture: ComponentFixture<ShopInfoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShopInfoModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopInfoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
