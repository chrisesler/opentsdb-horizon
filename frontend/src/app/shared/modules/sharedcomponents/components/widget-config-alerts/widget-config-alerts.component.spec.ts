import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetConfigAlertsComponent } from './widget-config-alerts.component';

describe('WidgetConfigAlertsComponent', () => {
  let component: WidgetConfigAlertsComponent;
  let fixture: ComponentFixture<WidgetConfigAlertsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetConfigAlertsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetConfigAlertsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
