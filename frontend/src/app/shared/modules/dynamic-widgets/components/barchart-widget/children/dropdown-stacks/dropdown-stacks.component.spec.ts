import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownStacksComponent } from './dropdown-stacks.component';

describe('DropdownStacksComponent', () => {
  let component: DropdownStacksComponent;
  let fixture: ComponentFixture<DropdownStacksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DropdownStacksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DropdownStacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
