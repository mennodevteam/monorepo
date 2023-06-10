import { TestBed } from '@angular/core/testing';

import { HamiService } from './hami.service';

describe('HamiService', () => {
  let service: HamiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HamiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
