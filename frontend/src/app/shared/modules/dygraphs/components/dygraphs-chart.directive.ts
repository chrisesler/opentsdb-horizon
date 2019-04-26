import { OnInit, OnChanges, OnDestroy, Directive,
         Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import { IDygraphOptions } from '../IDygraphOptions';
import Dygraph from 'dygraphs';
import { UnitConverterService } from '../../../../core/services/unit-converter.service';
import ThresholdsPlugin from '../../../dygraph-threshold-plugin/src/index';
import barChartPlotter from '../../../dygraphs/plotters';


@Directive({
// tslint:disable-next-line: directive-selector
  selector: '[dygraphsChart]',

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
        const labelsDiv = this.user_attrs_.labelsDiv;
        let xOffset = 10;
        let yOffset = 10;
        const labelDivWidth = labelsDiv.clientWidth;
        const labelDivHeight = labelsDiv.clientHeight;
        if (event.offsetX > (window.innerWidth - (1.2 * labelDivWidth))) {
            xOffset = - (labelDivWidth + 10);
        }
        if (event.offsetY > (window.innerHeight - (1.2 * labelDivHeight))){
            yOffset = - (labelDivHeight + 10);
        }
        labelsDiv.style.left = (event.offsetX  + xOffset ) + 'px';
        labelsDiv.style.top = (event.offsetY   + yOffset)  + 'px';
        labelsDiv.style.display = 'block';
    };

    const legendFormatter = function(data) {
        const seriesConfig = this.user_attrs_.series;
        if (data.x == null) {
            const labelsDiv = this.user_attrs_.labelsDiv;
            labelsDiv.style.display = 'none';
            return '';
        }

        let html = '<p>' + data.xHTML + '</p>';
        data.series.forEach(function(series) {
            if (!series.isVisible || !series.isHighlighted) {
                return;
            }
            const tags = seriesConfig[series.label].tags;
            const metric = tags.metric;
            html += '<p>Value: '  + series.yHTML + '</p>';
            html += '<p>' + metric + '</p>';
            for (const k in tags ) {
                if ( k !== 'metric' ) {
                    html += '<p>' + k + ': ' +  tags[k] + '</p>';
                }
            }
        });
        return html;
    };

    const _self = this;
    const tickFormatter = function(value, gran, opts) {
            const format = opts('tickFormat');
            const dunit = _self.uConverter.getNormalizedUnit(format.max, format);
            return _self.uConverter.convert(value, format.unit, dunit, format );
    };
    const valueFormatter = function(value, opts) {
        const format = opts('tickFormat');
        const precision = format.precision ? format.precision : 2;
        const dunit = _self.uConverter.getNormalizedUnit(format.max, format);
        return _self.uConverter.convert(value, format.unit, dunit, { unit: format.unit, precision: precision } );
    };



    if (!changes) {
      return;
    } else {
      console.log('dygraph changes', new Date().getMilliseconds(), changes);
      // if not then create it
      if (!this._g && this.data) {
        this.options.plugins = [ ThresholdsPlugin ];
        this.options.legendFormatter = legendFormatter;
        if ( this.options.labelsDiv) {
            this.options.highlightCallback = mouseover;
        }
        // this.options.plotter = barChartPlotter;
        this._g = new Dygraph(this.element.nativeElement, this.data.ts, this.options);
      }
      // if new data
      if (this._g && changes.data && changes.data.currentValue) {
        const ndata = changes.data.currentValue;
        if ( this.options.axes ) {
            for ( const k of Object.keys(this.options.axes) ) {
                const axis = this.options.axes[k];
                        if ( axis.tickFormat ) {
                            axis.axisLabelFormatter = tickFormatter;
                            axis.valueFormatter = valueFormatter;
                        } else {
                            delete axis.axisLabelFormatter;
                            delete axis.valueFormatter;
                        }
            }
        }
        this._g.destroy();
        this._g = new Dygraph(this.element.nativeElement, ndata.ts, this.options);
      }

      if ( this._g && changes.options && changes.options.currentValue ) {
        const options = changes.options.currentValue;

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
        this._g = new Dygraph(this.element.nativeElement, this.data.ts, this.options);
      }
        // resize when size be changed
        if (this._g && changes.size && changes.size.currentValue) {
            const nsize = changes.size.currentValue;
            this._g.resize(nsize.width, nsize.height);
        }
    }
  }

  ngOnDestroy() {

  }
}
