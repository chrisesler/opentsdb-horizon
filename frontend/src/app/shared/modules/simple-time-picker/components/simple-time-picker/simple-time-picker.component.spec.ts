import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleTimePickerComponent } from './simple-time-picker.component';

describe('SimpleTimePickerComponent', () => {
  let component: SimpleTimePickerComponent;
  let fixture: ComponentFixture<SimpleTimePickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SimpleTimePickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleTimePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
