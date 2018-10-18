import { OnInit, OnChanges, OnDestroy, Directive,
         Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import { IDygraphOptions } from '../IDygraphOptions';
import Dygraph from 'dygraphs';
import { UnitConverterService } from '../../../../core/services/unit-converter.service';
import ThresholdsPlugin from '../../../dygraph-threshold-plugin/src/index';
import multiColumnGroupPlotter from '../../../dygraphs/plotters';


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

  constructor(private element: ElementRef, private uConverter: UnitConverterService) { }

  ngOnInit() {
    // console.log('this chart type', this.options, this.chartType, this.element);   
  }

  ngOnChanges(changes: SimpleChanges) {

    const self = this;
    const mouseover = function(event, x, pts, row) {
        const partentPos = self.element.nativeElement.getBoundingClientRect();
        const labelsDiv = this.user_attrs_.labelsDiv;
        let xOffset = 10;
        let yOffset = 10;
        const labelDivWidth = labelsDiv.clientWidth;
        const labelDivHeight = labelsDiv.clientHeight;
        if (event.clientX > (window.innerWidth - (1.5 * labelDivWidth))) {
            xOffset = - (labelDivWidth + 10);
        }
        if (event.clientY > (window.innerHeight - (1.5 * labelDivHeight))){
            yOffset = - (labelDivHeight + 10);
        }
        labelsDiv.style.left = (event.clientX - partentPos.left + xOffset ) + 'px';
        labelsDiv.style.top = (event.clientY  - partentPos.top + yOffset)  + 'px';
    };

    const legendFormatter = function(data) {
        const seriesConfig = this.user_attrs_.series;
        if (data.x == null) {
            return '<li>' + data.series.map(function(series) { return series.dashHTML + ' ' + series.labelHTML; }).join('<li>');
        }

        let html = '<p>' + data.xHTML + '</p>';
        data.series.forEach(function(series) {
            if (!series.isVisible || !series.isHighlighted) {
                return;
            }
            const tags = seriesConfig[series.label].tags;
            const metric = seriesConfig[series.label].metric;
            html += '<p>Value: '  + series.yHTML + '</p>';
            html += '<p>' + metric + '</p>';
            for (const k in tags ) {
                html += '<p>' + k + ': ' +  tags[k] + '</p>';
            }
        });
        return html;
    };


    if (!changes) {
      return;
    } else {
      // console.log('changes', new Date().getMilliseconds(), changes);
      // if not then create it
      if(!this._g && this.data) {
        this.options.plugins = [ ThresholdsPlugin ];
        this.options.legendFormatter = legendFormatter;
        this.options.highlightCallback = mouseover;
        //this.options.plotter = multiColumnGroupPlotter;
        this._g = new Dygraph(this.element.nativeElement, this.data, this.options);
      }
      // resize when size be changed
      if(this._g && changes.size && changes.size.currentValue) {
        //console.log('call resize', changes.size.currentValue); 
        let nsize = changes.size.currentValue;    
        this._g.resize(nsize.width, nsize.height);
      }

      // if new data
      if (this._g && changes.data && changes.data.currentValue) {
        let ndata = changes.data.currentValue;
        this._g.destroy();
        this._g = new Dygraph(this.element.nativeElement, ndata, this.options);
      }

      if ( this._g && changes.options && changes.options.currentValue ) {
        const options = changes.options.currentValue;

        const _self = this;
        const tickFormatter = function(value, gran, opts) {
                const format = opts('tickFormat');
                const precision = format.precision ? format.precision : 2;
                return _self.uConverter.format(value, { unit: format.unit, precision: precision } );
        };
        const valueFormatter = function(value, opts) {
            const format = opts('tickFormat');
            const precision = format.precision ? format.precision : 2;
            return _self.uConverter.format(value, { unit: format.unit, precision: precision } );
        };
        if ( options.axes ) {
            for ( const k of Object.keys(options.axes) ) {
                const axis = options.axes[k];
                        if ( axis.tickFormat ) {
                            axis.axisLabelFormatter = tickFormatter;
                            axis.valueFormatter = valueFormatter;
                        } else {
                            delete axis.axisLabelFormatter;
                            delete axis.valueFormatter;
                        }
            }
        }
        // destroy only when y2 axis enabled
        this._g.destroy();
        this._g = new Dygraph(this.element.nativeElement, this.data, this.options);
      }
    }
  }

  ngOnDestroy() {

  }

}
