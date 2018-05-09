import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloseEditViewComponent } from './close-edit-view.component';

describe('CloseEditViewComponent', () => {
  let component: CloseEditViewComponent;
  let fixture: ComponentFixture<CloseEditViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloseEditViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloseEditViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
