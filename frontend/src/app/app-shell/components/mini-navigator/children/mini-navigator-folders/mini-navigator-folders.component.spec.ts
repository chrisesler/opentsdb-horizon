import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniNavigatorFoldersComponent } from './mini-navigator-folders.component';

describe('MiniNavigatorFoldersComponent', () => {
  let component: MiniNavigatorFoldersComponent;
  let fixture: ComponentFixture<MiniNavigatorFoldersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiniNavigatorFoldersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiniNavigatorFoldersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
