import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DingBottomSheetComponent } from './ding-bottom-sheet.component';

describe('DingBottomSheetComponent', () => {
  let component: DingBottomSheetComponent;
  let fixture: ComponentFixture<DingBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DingBottomSheetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DingBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
