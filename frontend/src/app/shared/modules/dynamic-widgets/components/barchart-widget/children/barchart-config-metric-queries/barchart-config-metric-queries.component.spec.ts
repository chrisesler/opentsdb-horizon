import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BarchartConfigMetricQueriesComponent } from './barchart-config-metric-queries.component';

describe('BarchartConfigMetricQueriesComponent', () => {
  let component: BarchartConfigMetricQueriesComponent;
  let fixture: ComponentFixture<BarchartConfigMetricQueriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BarchartConfigMetricQueriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BarchartConfigMetricQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
