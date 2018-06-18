import { OnInit, OnChanges, OnDestroy, AfterViewInit, Directive,
         Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import { IDygraphOptions } from '../IDygraphOptions';
import Dygraph from 'dygraphs';

@Directive({
  selector: '[dygraphsChart]'
})
export class DygraphsChartDirective implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  @Input() data: any[];
  @Input() options: IDygraphOptions;
  @Input() chartType: string;


  private _g: any;
  private gDimension: any;
  public dataLoading: boolean;

  constructor(private element: ElementRef) {
    // just set it up
    //this._g = new Dygraph(this.element.nativeElement, "X\n", {connectSeparatedPoints: true, drawPoints: true});
    //console.log('new created _g', this._g);
    
   }

  ngOnInit() {
    // console.log('this chart type', this.options, this.chartType, this.element);   
  }

  ngAfterViewInit() {
    console.log('wewewewew', this.options);
    
  }

  ngOnChanges(changes: SimpleChanges) {
    //console.log('onChanges dygraphs directive', changes);
    //this.gDimension = this.element.nativeElement.getBoundingClientRect();
    
    if (!changes) {
      return;
    }
  
    if (!this.data || !this.data.length) {
      this.dataLoading = false;
      return;
    }
    
     this.options =   {
      ...this.options,
      labels: ['x', 'A', 'B' ],
      connectSeparatedPoints: true, 
      drawPoints: true
    };

    if (changes.options && changes.options.firstChange) {
      
    }
    //this._g.width_ = 700;
    //this._g.height_ = 300;
    //console.log('this._g changes calling...', this._g, this.options);
    //this._g.updateOptions({
    //  ...this.options, 'file': this.data
    //});
   

    
    //setTimeout(() => {
    //  console.log('passing options', this.options);
      this._g = new Dygraph(this.element.nativeElement, this.data, this.options);
      this.dataLoading = false;
    //});
    if(changes.options) {
      console.log('call updateOptions');  
      this._g.updateOptions({...this.options});
    }
  }

  ngOnDestroy() {

  }

}
