import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryCardViewComponent } from './category-card-view.component';

describe('CategoryCardViewComponent', () => {
  let component: CategoryCardViewComponent;
  let fixture: ComponentFixture<CategoryCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryCardViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
