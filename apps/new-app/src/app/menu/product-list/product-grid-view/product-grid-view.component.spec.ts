import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductGridViewComponent } from './product-grid-view.component';

describe('ProductGridViewComponent', () => {
  let component: ProductGridViewComponent;
  let fixture: ComponentFixture<ProductGridViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGridViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductGridViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
