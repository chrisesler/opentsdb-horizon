import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetConfigLegendBigNumberComponent } from './widget-config-legend-big-number.component';

describe('WidgetConfigLegendComponent', () => {
  let component: WidgetConfigLegendBigNumberComponent;
  let fixture: ComponentFixture<WidgetConfigLegendBigNumberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetConfigLegendBigNumberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetConfigLegendBigNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
