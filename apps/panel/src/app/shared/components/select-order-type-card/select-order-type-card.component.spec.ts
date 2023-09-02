import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectOrderTypeCardComponent } from './select-order-type-card.component';

describe('SelectOrderTypeCardComponent', () => {
  let component: SelectOrderTypeCardComponent;
  let fixture: ComponentFixture<SelectOrderTypeCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectOrderTypeCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectOrderTypeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
