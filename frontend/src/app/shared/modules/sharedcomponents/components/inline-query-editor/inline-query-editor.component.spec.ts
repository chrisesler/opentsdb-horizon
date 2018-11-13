import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InlineQueryEditorComponent } from './inline-query-editor.component';

describe('InlineQueryEditorComponent', () => {
  let component: InlineQueryEditorComponent;
  let fixture: ComponentFixture<InlineQueryEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InlineQueryEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InlineQueryEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
