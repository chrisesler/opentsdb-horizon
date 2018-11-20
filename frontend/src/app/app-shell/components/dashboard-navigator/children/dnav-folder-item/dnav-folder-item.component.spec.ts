import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DnavFolderItemComponent } from './dnav-folder-item.component';

describe('DnavFolderItemComponent', () => {
  let component: DnavFolderItemComponent;
  let fixture: ComponentFixture<DnavFolderItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DnavFolderItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DnavFolderItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
