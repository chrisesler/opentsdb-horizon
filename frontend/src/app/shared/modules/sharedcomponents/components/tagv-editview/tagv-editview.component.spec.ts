import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagvEditviewComponent } from './tagv-editview.component';

describe('TagvEditviewComponent', () => {
  let component: TagvEditviewComponent;
  let fixture: ComponentFixture<TagvEditviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagvEditviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagvEditviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
