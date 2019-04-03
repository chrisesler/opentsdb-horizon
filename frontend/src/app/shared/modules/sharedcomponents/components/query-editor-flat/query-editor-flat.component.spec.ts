import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QueryEditorFlatComponent } from './query-editor-flat.component';

describe('QueryEditorFlatComponent', () => {
  let component: QueryEditorFlatComponent;
  let fixture: ComponentFixture<QueryEditorFlatComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QueryEditorFlatComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryEditorFlatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
