import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DboardHeaderComponent } from './dboard-header.component';

describe('DboardHeaderComponent', () => {
  let component: DboardHeaderComponent;
  let fixture: ComponentFixture<DboardHeaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DboardHeaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DboardHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
