import { OnInit, OnChanges, OnDestroy, AfterViewInit, Directive,
         Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import Dygraph from 'dygraphs';

@Directive({
  selector: '[dygraphsChart]'
})
export class DygraphsChartDirective implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  @Input() data: any[];
  @Input() options: any;
  @Input() chartType: string;


  private _g: any;
  private gDimension: any;
  public dataLoading: boolean;

  constructor(private element: ElementRef) { }

  ngOnInit() {
    console.log('this chart type', this.chartType, this.element);   
  }

  ngAfterViewInit() {
    console.log('wewewewew', this.element, this.element.nativeElement.clientHeight);
    
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('onChanges dygraphs directive', changes);
    this.gDimension = this.element.nativeElement.getBoundingClientRect();
    
    if (!changes) {
      return;
    }
  
    if (!this.data || !this.data.length) {
      this.dataLoading = false;
      return;
    }
 
   if (!this.options) {
     this.options =   {
      labels: ['x', 'A', 'B' ],
      connectSeparatedPoints: true,
      drawPoints: true
    };
   }

    this.dataLoading = true;
    let options = Object.assign({}, this.options);
    
    options.width = this.gDimension.width;
    options.height = this.gDimension.height;

    
    console.log('options', this.gDimension, options);
    setTimeout(() => {
      this._g = new Dygraph(this.element.nativeElement, this.data, options);
      this.dataLoading = false;
    });

  }

  ngOnDestroy() {

  }

}
