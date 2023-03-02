import { TestBed } from '@angular/core/testing';

import { TranslateGuard } from './translate.guard';

describe('TranslateGuard', () => {
  let guard: TranslateGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(TranslateGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
