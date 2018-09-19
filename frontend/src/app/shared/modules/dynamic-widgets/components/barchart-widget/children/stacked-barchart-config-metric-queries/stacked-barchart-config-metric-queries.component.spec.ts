import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StackedBarchartConfigMetricQueriesComponent } from './stacked-barchart-config-metric-queries.component';

describe('StackedBarchartConfigMetricQueriesComponent', () => {
  let component: StackedBarchartConfigMetricQueriesComponent;
  let fixture: ComponentFixture<StackedBarchartConfigMetricQueriesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StackedBarchartConfigMetricQueriesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedBarchartConfigMetricQueriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
