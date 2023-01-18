import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryGridViewComponent } from './category-grid-view.component';

describe('CategoryGridViewComponent', () => {
  let component: CategoryGridViewComponent;
  let fixture: ComponentFixture<CategoryGridViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryGridViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryGridViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
