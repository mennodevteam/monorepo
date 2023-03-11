import { TestBed } from '@angular/core/testing';

import { TodayOrdersGuard } from './today-orders.guard';

describe('TodayOrdersGuard', () => {
  let guard: TodayOrdersGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(TodayOrdersGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
