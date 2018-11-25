import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DnavDashboardsComponent } from './dnav-dashboards.component';

describe('DnavDashboardsComponent', () => {
  let component: DnavDashboardsComponent;
  let fixture: ComponentFixture<DnavDashboardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DnavDashboardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DnavDashboardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
