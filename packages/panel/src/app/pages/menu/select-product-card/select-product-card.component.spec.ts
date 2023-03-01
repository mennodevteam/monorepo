import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectProductCardComponent } from './select-product-card.component';

describe('SelectProductCardComponent', () => {
  let component: SelectProductCardComponent;
  let fixture: ComponentFixture<SelectProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectProductCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectProductCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
