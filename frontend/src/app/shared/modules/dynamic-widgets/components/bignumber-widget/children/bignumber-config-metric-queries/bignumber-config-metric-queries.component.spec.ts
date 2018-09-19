import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BignumberConfigMetricQueriesComponent } from './bignumber-config-metric-queries.component';

describe('BignumberConfigMetricQueriesComponent', () => {
  let component: BignumberConfigMetricQueriesComponent;
  let fixture: ComponentFixture<BignumberConfigMetricQueriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BignumberConfigMetricQueriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BignumberConfigMetricQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
