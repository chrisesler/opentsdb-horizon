import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SnoozeAlertDialogComponent } from './snooze-alert-dialog.component';

describe('SnoozeAlertDialogComponent', () => {
  let component: SnoozeAlertDialogComponent;
  let fixture: ComponentFixture<SnoozeAlertDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SnoozeAlertDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SnoozeAlertDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
