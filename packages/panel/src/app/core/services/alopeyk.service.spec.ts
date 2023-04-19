import { TestBed } from '@angular/core/testing';

import { AlopeykService } from './alopeyk.service';

describe('AlopeykService', () => {
  let service: AlopeykService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AlopeykService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
