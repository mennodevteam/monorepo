import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectStatusCardComponent } from './select-status-card.component';

describe('SelectStatusCardComponent', () => {
  let component: SelectStatusCardComponent;
  let fixture: ComponentFixture<SelectStatusCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectStatusCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectStatusCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
