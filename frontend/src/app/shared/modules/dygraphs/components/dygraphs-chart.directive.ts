import { OnInit, OnChanges, OnDestroy, Directive,
         Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import { IDygraphOptions } from '../IDygraphOptions';
import Dygraph from 'dygraphs';

@Directive({
  selector: '[dygraphsChart]'
})
export class DygraphsChartDirective implements OnInit, OnChanges, OnDestroy {

  @Input() data: any;
  @Input() options: IDygraphOptions;
  @Input() chartType: string;
  @Input() size: any;


  private _g: any;
  private gDimension: any;
  public dataLoading: boolean;

  constructor(private element: ElementRef) { }

  ngOnInit() {
    // console.log('this chart type', this.options, this.chartType, this.element);   
  }

  ngOnChanges(changes: SimpleChanges) {

    if(!changes) {
      console.log('no changes');
      return;
    } else {
      // console.log('changes', new Date().getMilliseconds(), changes);
      // if not then create it
      if(!this._g && this.data) {
        // console.log('create dygraph object');
        this._g = new Dygraph(this.element.nativeElement, this.data, this.options);
      }
      // resize when size be changed
      if(this._g && changes.size && changes.size.currentValue) {
        console.log('call resize', changes.size.currentValue); 
        let nsize = changes.size.currentValue;    
        this._g.resize(nsize.width - 24, nsize.height - 50);
      }

      // if new data
      if (this._g && changes.data && changes.data.currentValue) {
        // console.log(' call new data', changes.data.currentValue);
        let ndata = changes.data.currentValue;
        this.options = {...this.options, file: ndata}
        this._g.updateOptions(this.options);
      }
    }
  }

  ngOnDestroy() {

  }

}
