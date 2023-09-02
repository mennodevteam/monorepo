import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectOrderTypeModalComponent } from './select-order-type-modal.component';

describe('SelectOrderTypeModalComponent', () => {
  let component: SelectOrderTypeModalComponent;
  let fixture: ComponentFixture<SelectOrderTypeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectOrderTypeModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectOrderTypeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
