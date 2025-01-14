import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BasalamProductsTableComponent } from './basalam-products-table.component';

describe('BasalamProductsTableComponent', () => {
  let component: BasalamProductsTableComponent;
  let fixture: ComponentFixture<BasalamProductsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasalamProductsTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BasalamProductsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
