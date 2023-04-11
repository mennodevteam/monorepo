import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryCompactViewComponent } from './category-compact-view.component';

describe('CategoryCompactViewComponent', () => {
  let component: CategoryCompactViewComponent;
  let fixture: ComponentFixture<CategoryCompactViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryCompactViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryCompactViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
