import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscountsPageComponent } from './discounts-page.component';

describe('DiscountsPageComponent', () => {
  let component: DiscountsPageComponent;
  let fixture: ComponentFixture<DiscountsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DiscountsPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscountsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
