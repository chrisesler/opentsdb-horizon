import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NamespaceTagValuesComponent } from './namespace-tag-values.component';

describe('NamespaceTagValuesComponent', () => {
  let component: NamespaceTagValuesComponent;
  let fixture: ComponentFixture<NamespaceTagValuesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NamespaceTagValuesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NamespaceTagValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
