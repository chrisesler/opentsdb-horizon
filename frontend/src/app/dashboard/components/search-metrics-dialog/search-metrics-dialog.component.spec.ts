import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchMetricsDialogComponent } from './search-metrics-dialog.component';

describe('SearchMetricsDialogComponent', () => {
  let component: SearchMetricsDialogComponent;
  let fixture: ComponentFixture<SearchMetricsDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchMetricsDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchMetricsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
