import { TestBed } from '@angular/core/testing';

import { TodayOrdersService } from './today-orders.service';

describe('TodayOrdersService', () => {
  let service: TodayOrdersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TodayOrdersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
