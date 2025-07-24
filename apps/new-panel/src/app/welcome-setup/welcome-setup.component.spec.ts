import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WelcomeSetupComponent } from './welcome-setup.component';

describe('WelcomeSetupComponent', () => {
  let component: WelcomeSetupComponent;
  let fixture: ComponentFixture<WelcomeSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WelcomeSetupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WelcomeSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
