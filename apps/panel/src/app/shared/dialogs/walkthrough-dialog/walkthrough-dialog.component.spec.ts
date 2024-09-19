import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WalkthroughDialogComponent } from './walkthrough-dialog.component';

describe('WalkthroughDialogComponent', () => {
  let component: WalkthroughDialogComponent;
  let fixture: ComponentFixture<WalkthroughDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WalkthroughDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WalkthroughDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
