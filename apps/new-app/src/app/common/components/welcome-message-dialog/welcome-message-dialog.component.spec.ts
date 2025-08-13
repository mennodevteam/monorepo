import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WelcomeMessageDialogComponent } from './welcome-message-dialog.component';

describe('WelcomeMessageDialogComponent', () => {
  let component: WelcomeMessageDialogComponent;
  let fixture: ComponentFixture<WelcomeMessageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeMessageDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeMessageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
