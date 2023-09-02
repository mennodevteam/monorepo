import { TestBed } from '@angular/core/testing';

import { DingService } from './ding.service';

describe('DingService', () => {
  let service: DingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
