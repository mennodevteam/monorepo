import { TestBed } from '@angular/core/testing';

import { DailyOrderListService } from './daily-order-list.service';

describe('DailyOrderListService', () => {
  let service: DailyOrderListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyOrderListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
