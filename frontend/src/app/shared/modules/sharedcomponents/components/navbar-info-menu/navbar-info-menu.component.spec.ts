import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarInfoMenuComponent } from './navbar-info-menu.component';

describe('NavbarInfoMenuComponent', () => {
  let component: NavbarInfoMenuComponent;
  let fixture: ComponentFixture<NavbarInfoMenuComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavbarInfoMenuComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarInfoMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
