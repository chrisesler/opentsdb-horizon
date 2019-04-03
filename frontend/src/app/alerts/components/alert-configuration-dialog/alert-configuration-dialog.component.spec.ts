import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertConfigurationDialogComponent } from './alert-configuration-dialog.component';

describe('AlertConfigurationDialogComponent', () => {
  let component: AlertConfigurationDialogComponent;
  let fixture: ComponentFixture<AlertConfigurationDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AlertConfigurationDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlertConfigurationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
