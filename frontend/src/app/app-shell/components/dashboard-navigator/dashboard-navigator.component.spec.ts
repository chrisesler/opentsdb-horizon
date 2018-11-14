import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardNavigatorComponent } from './dashboard-navigator.component';

describe('DashboardNavigatorComponent', () => {
  let component: DashboardNavigatorComponent;
  let fixture: ComponentFixture<DashboardNavigatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DashboardNavigatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardNavigatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
