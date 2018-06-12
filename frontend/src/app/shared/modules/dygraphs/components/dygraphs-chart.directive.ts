import { OnInit, OnChanges, OnDestroy, AfterViewInit, Directive,
         Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import Dygraphs from 'dygraphs';

@Directive({
  selector: '[dygraphsChart]'
})
export class DygraphsChartDirective implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  @Input() data: any[];
  @Input() options: any;
  @Input() chartType: string;


  private _g: any;
  private element: ElementRef;
  private gDimension: any;
  public dataLoading: boolean;

  constructor() { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.gDimension = this.element.nativeElement.getBoudingClientRect();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes) {
      return;
    }
    if (!this.data || !this.data.length) {
      this.dataLoading = false;
      return;
    }
    this.dataLoading = true;
    const options = Object.assign({}, this.options);

    this.options.width = this.gDimension.width;
    this.options.height = this.gDimension.height;

    setTimeout(() => {
      this._g = new Dygraph(this.element.nativeElement, this.data, options);
      this.dataLoading = false;
    });

  }

  ngOnDestroy() {

  }

}
