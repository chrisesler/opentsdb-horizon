import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DbfsFolderComponent } from './dbfs-folder.component';

describe('DbfsFolderComponent', () => {
  let component: DbfsFolderComponent;
  let fixture: ComponentFixture<DbfsFolderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DbfsFolderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DbfsFolderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
