import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchAllDialogComponent } from './search-all-dialog.component';

describe('SearchAllDialogComponent', () => {
  let component: SearchAllDialogComponent;
  let fixture: ComponentFixture<SearchAllDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SearchAllDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchAllDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
