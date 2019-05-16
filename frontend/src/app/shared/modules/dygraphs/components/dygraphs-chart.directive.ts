import { OnInit, OnChanges, OnDestroy, Directive,
         Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import { IDygraphOptions } from '../IDygraphOptions';
import Dygraph from 'dygraphs/src-es5/dygraph.js';
import { UnitConverterService } from '../../../../core/services/unit-converter.service';
import ThresholdsPlugin from '../../../dygraph-threshold-plugin/src/index';
import * as moment from 'moment';

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
        if ( self.chartType !== 'heatmap' ) {
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
        }
        return html;
    };

    const _self = this;
    const tickFormatter = function(value, gran, opts) {
            const format = opts('tickFormat');
            const dunit = _self.uConverter.getNormalizedUnit(value, format);
            return _self.uConverter.convert(value, format.unit, dunit, format );
    };
    const valueFormatter = function(value, opts) {
        const format = opts('tickFormat');
        const precision = format.precision ? format.precision : 2;
        const dunit = _self.uConverter.getNormalizedUnit(format.max, format);
        return _self.uConverter.convert(value, format.unit, dunit, { unit: format.unit, precision: precision } );
    };

    const setHeatmapLegend = function(event, g, x, bucket) {
        const labelsDiv = g.user_attrs_.labelsDiv;
        const options = g.user_attrs_;
        const tooltipData = options.series[bucket] && options.series[bucket][x] ? options.series[bucket][x] : [];

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

        let html  =  '';
        html = options.labelsUTC ? moment(x).utc().format('YYYY/MM/DD HH:mm') : moment(x).format('YYYY/MM/DD HH:mm');
        html += '<br>' + tooltipData.length + ' of ' + options.heatmap.nseries + ' Series(s)<br><table>';
        tooltipData.sort((a, b) => b.v - a.v);
        const n = tooltipData.length < 5 ? tooltipData.length : 5;
        for ( let i = 0; i < n; i++ ) {
                html += '<tr><td>' + tooltipData[i].v.toFixed(3) + '</td><td>' + tooltipData[i].label + '</td></tr>';
        }
        html += '</table>';
        labelsDiv.innerHTML =  html;
    }



    if (!changes) {
      return;
    } else {
      // if not then create it
      if (!this._g && this.data) {
        this.options.plugins = [ ThresholdsPlugin ];

        if ( this.chartType === 'line') {
            if ( this.options.labelsDiv) {
                this.options.highlightCallback = mouseover;
            }
            this.options.legendFormatter = legendFormatter;
        } else if ( this.chartType === 'heatmap' ) {
            this.options.interactionModel = {
                'mousemove' : function(event, g, context) {
                    const xlabels = g.user_attrs_.heatmap.x;
                    if ( !xlabels || !xlabels.length ) {
                        return;
                    }
                    const ctx = g.canvas_ctx_;
                    const plotArea = g.layout_.getPlotArea();
                    const height = plotArea.h / g.user_attrs_.heatmap.buckets;
                    const width = g.layout_.points.length > 1 ? g.layout_.points[0][1].canvasx - g.layout_.points[0][0].canvasx : 0;
                    const prevHighlightArea = g._prevBucketHighlightBucket;
                    const labelsDiv = g.user_attrs_.labelsDiv;

                    const xdiff = xlabels[1] - xlabels[0];
                    const xdiffd2 = xdiff / 2;
                    const graphPos = Dygraph.findPos(g.graphDiv);
                    const cx = Dygraph.pageX(event) - graphPos.x;
                    let xv = g.toDataXCoord(Dygraph.pageX(event) - graphPos.x);
                    const d = xv % xdiff;
                    xv = d > xdiffd2 ? xv + (xdiff - d) : xv - d;
                    const cx2 = g.toDomXCoord(xv);

                    const cy = Dygraph.pageY(event) - graphPos.y;

                    if (prevHighlightArea) {
                        g.clearSelection();
                    }

                    const bucket = g.user_attrs_.heatmap.buckets  - (cy - cy % height) / height;
                    const ts = g.toDataXCoord(cx2);
                    const hasData = g.user_attrs_.series[bucket] && g.user_attrs_.series[bucket][ts];
                    if ( hasData ) {
                        setHeatmapLegend(event, g, ts, bucket);
                    } else {
                        labelsDiv.style.display = 'none';
                    }

                    if ( cx >= plotArea.x  && cy <= plotArea.h   ) { 
                        const x = cx2 - width / 2;
                        const y = cy - cy % height;
                        ctx.fillStyle = !hasData ? '#dddddd' : g.user_attrs_.heatmap.color;
                        ctx.fillRect(x, y, width, height);
                        ctx.strokeStyle = 'red';
                        ctx.strokeWidth = 1;
                        ctx.rect(x, 0, width, plotArea.h);
                        ctx.stroke();
                        g._prevBucketHighlightBucket = {x: x, y: y, w: width, h: height};
                    }
                }
            };
        }
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
            this._g.updateOptions(this.options);
            this._g.resize(nsize.width, nsize.height);
        }
    }
  }

  ngOnDestroy() {

  }
}
