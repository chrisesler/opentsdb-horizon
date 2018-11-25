import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DnavDashboardItemComponent } from './dnav-dashboard-item.component';

describe('DnavDashboardItemComponent', () => {
  let component: DnavDashboardItemComponent;
  let fixture: ComponentFixture<DnavDashboardItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DnavDashboardItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DnavDashboardItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
