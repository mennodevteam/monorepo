import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisableOrderingCardComponent } from './disable-ordering-card.component';

describe('DisableOrderingCardComponent', () => {
  let component: DisableOrderingCardComponent;
  let fixture: ComponentFixture<DisableOrderingCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DisableOrderingCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisableOrderingCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
