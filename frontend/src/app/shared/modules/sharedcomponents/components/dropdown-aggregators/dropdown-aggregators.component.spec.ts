import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownAggregatorsComponent } from './dropdown-aggregators.component';

describe('DropdownAggregatorsComponent', () => {
  let component: DropdownAggregatorsComponent;
  let fixture: ComponentFixture<DropdownAggregatorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DropdownAggregatorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DropdownAggregatorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
