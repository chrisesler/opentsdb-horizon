import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VariableTemplateBarComponent } from './variable-template-bar.component';

describe('VariableTemplateBarComponent', () => {
  let component: VariableTemplateBarComponent;
  let fixture: ComponentFixture<VariableTemplateBarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VariableTemplateBarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VariableTemplateBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
