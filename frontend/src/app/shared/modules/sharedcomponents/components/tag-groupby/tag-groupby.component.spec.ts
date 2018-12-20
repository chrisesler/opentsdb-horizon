import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TagGroupbyComponent } from './tag-groupby.component';

describe('TagGroupbyComponent', () => {
  let component: TagGroupbyComponent;
  let fixture: ComponentFixture<TagGroupbyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagGroupbyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagGroupbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
