import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniNavigatorComponent } from './mini-navigator.component';

describe('MiniNavigatorComponent', () => {
  let component: MiniNavigatorComponent;
  let fixture: ComponentFixture<MiniNavigatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiniNavigatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiniNavigatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
