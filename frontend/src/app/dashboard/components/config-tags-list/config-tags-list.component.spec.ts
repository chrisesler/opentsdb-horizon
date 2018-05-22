import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigTagsListComponent } from './config-tags-list.component';

describe('ConfigTagsListComponent', () => {
  let component: ConfigTagsListComponent;
  let fixture: ComponentFixture<ConfigTagsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigTagsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigTagsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
