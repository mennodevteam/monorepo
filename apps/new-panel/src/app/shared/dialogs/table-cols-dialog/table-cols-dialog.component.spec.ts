import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableColsDialogComponent } from './table-cols-dialog.component';

describe('TableColsDialogComponent', () => {
  let component: TableColsDialogComponent;
  let fixture: ComponentFixture<TableColsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableColsDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TableColsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
