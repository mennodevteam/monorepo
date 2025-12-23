import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HomeSectionsService } from '../home-sections.service';
import { MenuService } from '../../menu/menu.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeSection, HomeSectionType, CategoryListConfig, CategoryListViewType, ProductCategory } from '@menno/types';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from '../../core/services/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, CdkDragHandle } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-category-list-edit',
  standalone: true,
  imports: [
    SHARED,
    ReactiveFormsModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    EmptyStateComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './category-list-edit.component.html',
  styleUrl: './category-list-edit.component.scss',
})
export class CategoryListEditComponent implements FormComponent {
  private readonly homeSectionsService = inject(HomeSectionsService);
  private readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly location = inject(PlatformLocation);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(DialogService);
  private readonly snack = inject(MatSnackBar);
  private readonly t = inject(TranslateService);

  private readonly initialized = signal(false);
  private readonly sectionId = signal<string | null>(
    this.route.snapshot.paramMap.get('id') || null,
  );
  section = signal<HomeSection | null>(null);
  readonly CategoryListViewType = CategoryListViewType;

  readonly form = this.fb.group({
    viewType: this.fb.control<CategoryListViewType>(CategoryListViewType.Carousel, {
      validators: [Validators.required],
      nonNullable: true,
    }),
    title: this.fb.control(''),
    categoryIds: this.fb.control<number[]>([], { validators: [Validators.required], nonNullable: true }),
    gridCols: this.fb.control<number>(2, {
      validators: [Validators.required, Validators.min(1), Validators.max(6)],
      nonNullable: true,
    }),
    carouselRows: this.fb.control<number>(1, {
      validators: [Validators.required, Validators.min(1), Validators.max(4)],
      nonNullable: true,
    }),
    showAll: this.fb.control<boolean>(false, { nonNullable: true }),
  });

  readonly allCategories = computed(() => this.menuService.categories() || []);
  searchCategoryInput = signal<string>('');

  readonly filteredCategories = computed(() => {
    const categories = this.allCategories();
    const selectedIds = this.form.controls.categoryIds.value;
    const searchQuery = this.searchCategoryInput().toLowerCase();
    
    return categories.filter(
      (category) =>
        !selectedIds.includes(category.id) && category.title.toLowerCase().includes(searchQuery)
    );
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.sectionId.set(params.get('id') || null);
      this.initialized.set(false);
    });

    effect(() => {
      const sections = this.homeSectionsService.homeSections();
      const categories = this.allCategories();
      if (!sections || !categories || this.initialized()) return;

      const stateSection = this.router.getCurrentNavigation()?.extras?.state?.['section'] as HomeSection | undefined;
      
      const existing = stateSection || (this.sectionId()
        ? sections.find((item) => item.id === this.sectionId())
        : undefined);

      this.section.set(existing ?? null);

      const config = existing?.config as CategoryListConfig | undefined;

      this.form.patchValue({
        viewType: config?.viewType || CategoryListViewType.Carousel,
        title: config?.title || '',
        categoryIds: config?.categoryIds || [],
        gridCols: config?.gridCols || 2,
        carouselRows: config?.carouselRows || 1,
        showAll: config?.showAll || false,
      });

      this.form.markAsPristine();
      this.initialized.set(true);
    });
  }

  getCategoryById(id: number): ProductCategory | undefined {
    return this.allCategories().find((cat) => cat.id === id);
  }

  selectCategory(category: ProductCategory) {
    const current = this.form.controls.categoryIds.value;
    if (!current.includes(category.id)) {
      this.form.controls.categoryIds.setValue([...current, category.id]);
      this.form.markAsDirty();
    }
    this.searchCategoryInput.set('');
  }

  removeCategory(categoryId: number) {
    const current = this.form.controls.categoryIds.value;
    this.form.controls.categoryIds.setValue(current.filter((id) => id !== categoryId));
    this.form.markAsDirty();
  }

  moveCategory(event: CdkDragDrop<number[]>) {
    const current = this.form.controls.categoryIds.value;
    const newOrder = [...current];
    moveItemInArray(newOrder, event.previousIndex, event.currentIndex);
    this.form.controls.categoryIds.setValue(newOrder);
    this.form.markAsDirty();
  }

  async submit() {
    if (this.form.invalid) return;

    const fv = this.form.getRawValue();
    const config: CategoryListConfig = {
      viewType: fv.viewType,
      categoryIds: fv.categoryIds,
      title: fv.title || undefined,
      gridCols: fv.viewType === CategoryListViewType.Grid ? fv.gridCols : undefined,
      carouselRows: (fv.viewType === CategoryListViewType.Carousel || fv.viewType === CategoryListViewType.Button) ? fv.carouselRows : undefined,
      showAll: fv.showAll || undefined,
    };

    const section: HomeSection = {
      id: this.sectionId() || undefined,
      type: HomeSectionType.CategoryList,
      config,
      position: 0,
      isVisible: true,
    } as HomeSection;

    await this.homeSectionsService.saveMutation.mutateAsync(section);
    this.form.markAsPristine();
    this.router.navigate(['/home-sections']);
  }

  canDeactivate() {
    return !this.form.dirty;
  }
}

