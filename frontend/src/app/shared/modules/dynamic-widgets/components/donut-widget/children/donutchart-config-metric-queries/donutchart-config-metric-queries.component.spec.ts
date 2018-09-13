import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DonutchartConfigMetricQueriesComponent } from './donutchart-config-metric-queries.component';

describe('DonutchartConfigMetricQueriesComponent', () => {
  let component: DonutchartConfigMetricQueriesComponent;
  let fixture: ComponentFixture<DonutchartConfigMetricQueriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DonutchartConfigMetricQueriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DonutchartConfigMetricQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
