import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KSHomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: KSHomeComponent;
  let fixture: ComponentFixture<KSHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KSHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KSHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
