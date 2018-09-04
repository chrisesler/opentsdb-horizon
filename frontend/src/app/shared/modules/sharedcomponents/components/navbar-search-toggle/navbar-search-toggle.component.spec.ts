import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarSearchToggleComponent } from './navbar-search-toggle.component';

describe('NavbarSearchToggleComponent', () => {
  let component: NavbarSearchToggleComponent;
  let fixture: ComponentFixture<NavbarSearchToggleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavbarSearchToggleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarSearchToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
