import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DbfsFileComponent } from './dbfs-file.component';

describe('DbfsFileComponent', () => {
  let component: DbfsFileComponent;
  let fixture: ComponentFixture<DbfsFileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DbfsFileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DbfsFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
