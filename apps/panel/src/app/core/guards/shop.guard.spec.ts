import { TestBed } from '@angular/core/testing';

import { ShopGuard } from './shop.guard';

describe('ShopGuard', () => {
  let guard: ShopGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(ShopGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
