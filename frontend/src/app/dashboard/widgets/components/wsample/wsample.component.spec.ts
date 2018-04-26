import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WsampleComponent } from './wsample.component';

describe('WsampleComponent', () => {
  let component: WsampleComponent;
  let fixture: ComponentFixture<WsampleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WsampleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WsampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
