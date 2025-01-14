import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BasalamComponent } from './basalam.component';

describe('BasalamComponent', () => {
  let component: BasalamComponent;
  let fixture: ComponentFixture<BasalamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasalamComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BasalamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
