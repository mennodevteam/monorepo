import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { CategoryListComponent } from './category-list.component';
import { MenuService } from '../menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../shop/shop.service';

describe('CategoryListComponent', () => {
  let component: CategoryListComponent;
  let fixture: ComponentFixture<CategoryListComponent>;

  beforeEach(async () => {
    const menuServiceStub = {
      categories: () => [],
      sortCategoriesMutation: { mutate: jasmine.createSpy('sortCategories') },
      saveCategoryMutation: { mutate: jasmine.createSpy('saveCategory') },
      deleteCategoryMutation: { mutate: jasmine.createSpy('deleteCategory') },
    };

    await TestBed.configureTestingModule({
      imports: [CategoryListComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParams: {} },
          },
        },
        { provide: MenuService, useValue: menuServiceStub },
        { provide: DialogService, useValue: { sort: () => Promise.resolve(), alert: () => Promise.resolve(true) } },
        { provide: TranslateService, useValue: { instant: () => '' } },
        { provide: ShopService, useValue: { businessCategoryMenuTitle: () => '' } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
