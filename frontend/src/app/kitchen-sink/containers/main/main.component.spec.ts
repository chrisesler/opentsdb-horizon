import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KSMainComponent } from './main.component';

describe('MainComponent', () => {
  let component: KSMainComponent;
  let fixture: ComponentFixture<KSMainComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KSMainComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KSMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
