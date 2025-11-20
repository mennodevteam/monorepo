import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategoryEditComponent } from './category-edit.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { PlatformLocation } from '@angular/common';
import { of } from 'rxjs';
import { MenuService } from '../menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { FilesService } from '../../core/services/files.service';

describe('CategoryEditComponent', () => {
  let component: CategoryEditComponent;
  let fixture: ComponentFixture<CategoryEditComponent>;

  beforeEach(async () => {
    const menuServiceStub = {
      categories: () => [],
      data: () => ({ id: 1 }),
      saveCategoryMutation: { mutate: jasmine.createSpy('mutate') },
    };
    const dialogServiceStub = {
      imageCropper: jasmine.createSpy('imageCropper').and.resolveTo(undefined),
    };
    const filesServiceStub = {
      upload: jasmine.createSpy('upload'),
      saveFileImage: jasmine.createSpy('saveFileImage'),
    };

    await TestBed.configureTestingModule({
      imports: [CategoryEditComponent, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
        { provide: MenuService, useValue: menuServiceStub },
        { provide: PlatformLocation, useValue: { back: () => undefined } },
        { provide: DialogService, useValue: dialogServiceStub },
        { provide: FilesService, useValue: filesServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

