import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NamespaceTagAutocompleteComponent } from './namespace-tag-autocomplete.component';

describe('NamespaceTagAutocompleteComponent', () => {
  let component: NamespaceTagAutocompleteComponent;
  let fixture: ComponentFixture<NamespaceTagAutocompleteComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NamespaceTagAutocompleteComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespaceTagAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
