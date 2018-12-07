import { TestBed } from '@angular/core/testing';

import { DashboardNavigatorService } from './dashboard-navigator.service';

describe('DashboardNavigatorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DashboardNavigatorService = TestBed.get(DashboardNavigatorService);
    expect(service).toBeTruthy();
  });
});
