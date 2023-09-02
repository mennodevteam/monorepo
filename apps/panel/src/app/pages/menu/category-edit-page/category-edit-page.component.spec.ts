import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryEditPageComponent } from './category-edit-page.component';

describe('CategoryEditPageComponent', () => {
  let component: CategoryEditPageComponent;
  let fixture: ComponentFixture<CategoryEditPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryEditPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryEditPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
