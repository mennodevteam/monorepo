import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HamiComponent } from './hami.component';

describe('HamiComponent', () => {
  let component: HamiComponent;
  let fixture: ComponentFixture<HamiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HamiComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HamiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
