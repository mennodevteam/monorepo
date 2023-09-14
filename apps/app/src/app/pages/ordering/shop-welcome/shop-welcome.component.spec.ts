import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShopWelcomeComponent } from './shop-welcome.component';

describe('ShopWelcomeComponent', () => {
  let component: ShopWelcomeComponent;
  let fixture: ComponentFixture<ShopWelcomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ShopWelcomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopWelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
