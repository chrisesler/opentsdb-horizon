import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DnavFoldersComponent } from './dnav-folders.component';

describe('DnavFoldersComponent', () => {
  let component: DnavFoldersComponent;
  let fixture: ComponentFixture<DnavFoldersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DnavFoldersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DnavFoldersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
