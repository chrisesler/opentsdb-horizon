import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetbaseComponent } from './widgetbase.component';

describe('WidgetbaseComponent', () => {
  let component: WidgetbaseComponent;
  let fixture: ComponentFixture<WidgetbaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetbaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetbaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
