import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StackedBarchartVisualAppearanceComponent } from './stacked-barchart-visual-appearance.component';

describe('StackedBarchartVisualAppearanceComponent', () => {
  let component: StackedBarchartVisualAppearanceComponent;
  let fixture: ComponentFixture<StackedBarchartVisualAppearanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StackedBarchartVisualAppearanceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedBarchartVisualAppearanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
