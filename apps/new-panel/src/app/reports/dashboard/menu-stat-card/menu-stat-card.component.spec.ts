import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuStatCardComponent } from './menu-stat-card.component';

describe('MenuStatCardComponent', () => {
  let component: MenuStatCardComponent;
  let fixture: ComponentFixture<MenuStatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuStatCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuStatCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
