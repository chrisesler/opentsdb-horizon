import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetConfigVisualAppearanceBigNumberComponent } from './widget-config-visual-appearance-big-number.component';

describe('WidgetConfigVisualAppearanceComponent', () => {
  let component: WidgetConfigVisualAppearanceBigNumberComponent;
  let fixture: ComponentFixture<WidgetConfigVisualAppearanceBigNumberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetConfigVisualAppearanceBigNumberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetConfigVisualAppearanceBigNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
