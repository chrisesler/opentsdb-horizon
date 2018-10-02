import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KSPageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let component: KSPageHeaderComponent;
  let fixture: ComponentFixture<KSPageHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KSPageHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KSPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
