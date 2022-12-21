import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCategoryContainerComponent } from './menu-category-container.component';

describe('MenuCategoryContainerComponent', () => {
  let component: MenuCategoryContainerComponent;
  let fixture: ComponentFixture<MenuCategoryContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MenuCategoryContainerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuCategoryContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
