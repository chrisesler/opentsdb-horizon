import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchMetricsDialogComponentV0 } from './search-metrics-dialog.component-v0';

describe('SearchMetricDialogComponent', () => {
  let component: SearchMetricsDialogComponentV0;
  let fixture: ComponentFixture<SearchMetricsDialogComponentV0>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchMetricsDialogComponentV0 ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchMetricsDialogComponentV0);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
