import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniNavigatorFolderItemComponent } from './mini-navigator-folder-item.component';

describe('MiniNavigatorFolderItemComponent', () => {
  let component: MiniNavigatorFolderItemComponent;
  let fixture: ComponentFixture<MiniNavigatorFolderItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MiniNavigatorFolderItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MiniNavigatorFolderItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
