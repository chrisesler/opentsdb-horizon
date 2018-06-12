import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LinebarWidgetComponent } from './linebar-widget.component';

describe('LinebarWidgetComponent', () => {
  let component: LinebarWidgetComponent;
  let fixture: ComponentFixture<LinebarWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LinebarWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LinebarWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
