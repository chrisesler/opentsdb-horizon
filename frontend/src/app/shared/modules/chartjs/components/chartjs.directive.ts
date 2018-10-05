import { OnInit, OnChanges, OnDestroy, Directive,
    Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import 'chart.js';
import * as thresholdPlugin from '../../../chartjs-threshold-plugin/src/index';
import { UnitConverterService } from '../../../../core/services/unit-converter.service';
import 'chartjs-plugin-labels';



@Directive({
  selector: '[chartjs]'
})
export class ChartjsDirective implements OnInit, OnChanges, OnDestroy  {
    @Input() data: any;
    @Input() options: any;
    @Input() chartType: string;

    /**
     * holds chart instance
     */
    chart: any;

    /**
     * default chart options
     */
    defaultOptions: any = {
        animation: {
            duration: 0,
        },
        responsive: true,
        legend: {
            display: false
        },
        responsiveAnimationDuration: 0,
        maintainAspectRatio: false
    };

    /**
     * colors
     */
    colors: any = [ '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c',
                    '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5',
                    '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f',
                    '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5',
                    '#393b79', '#5254a3', '#6b6ecf', '#9c9ede', '#637939',
                    '#8ca252', '#b5cf6b', '#cedb9c', '#bd9e39', '#e7ba52',
                    '#e7cb94', '#ad494a', '#d6616b', '#e7969c', '#7b4173',
                    '#a55194', '#ce6dbd', '#de9ed6'];
    /**
     * temp. var holds colors
     */
    _meta: any = {};

    constructor( private element: ElementRef, private uConverter: UnitConverterService ) { 
        const self = this;
        const tooltipFormatter = function(item, data) {
            const axis = self.chartType.indexOf('horizontal') >= 0 ? 'x' : 'y';
            if ( self.options.scales && self.options.scales[ axis + 'Axes' ][0].ticks.format ) {
                const tickFormat = self.options.scales[axis + 'Axes'][0].ticks.format;
                const unit = tickFormat.unit;
                const precision = tickFormat.precision && !Number.isInteger(item[axis + 'Label']) ? tickFormat.precision : 0;
                return self.uConverter.format(item[axis + 'Label'], { unit: unit, precision: precision } );
            } else {
                return item[axis + 'Label'] ?
                    item[axis + 'Label'] : self.uConverter.format(data['datasets'][0]['data'][item['index']], { unit: '', precision: 2 });
            }
        };
        this.defaultOptions.tooltips = { callbacks: { label : tooltipFormatter } } ;
    }

    ngOnInit() {
    }

    ngOnChanges(changes: SimpleChanges) {
        if ( changes ) {
            if ( !this.chart && this.data ) {
                const ctx = this.element.nativeElement.getContext('2d');
                this.updateDatasets(this.data);
                this.chart = new Chart(ctx, {
                    type: this.chartType,
                    plugins: [ thresholdPlugin ],
                    options: Object.assign(this.defaultOptions, this.options),
                    data: {
                        labels: this.options.labels,
                        datasets: this.data
                    }
                });
            } else if ( this.chart && ( changes.data  || changes.options ) ) {
                this.chart.data.datasets = [];
                this.updateDatasets(this.data);
                this.data.forEach((dataset) => {
                    this.chart.data.datasets.push(dataset);
                });
                this.chart.data.labels = this.options.labels;

                const self = this;
                const tickFormatter = function(value) {
                    if ( this.options.ticks.format ) {
                        const unit = this.options.ticks.format.unit;
                        const precision = this.options.ticks.format.precision ? this.options.ticks.format.precision : 0;
                        return self.uConverter.format(value, { unit: unit, precision: precision } );
                    } else {
                        return value;
                    }
                };

                if ( this.options.scales ) {
                    Object.keys(this.options.scales).forEach( k => {
                        this.options.scales[k].forEach( axis => {
                            if ( axis.ticks ) {
                                if ( axis.ticks.format ) {
                                    axis.ticks.callback = tickFormatter;
                                } else {
                                    delete axis.ticks.callback;
                                }
                            }
                        });
                    });
                }
                this.chart.options = Object.assign(this.defaultOptions, this.options);
                this.chart.update(0);
            }  else if ( this.chart && changes.chartType ) {
                this.chart.destroy();
                const ctx = this.element.nativeElement.getContext('2d');
                this.updateDatasets(this.data);
                this.chart = new Chart(ctx, {
                    type: this.chartType,
                    plugins: [ thresholdPlugin ],
                    options: Object.assign(this.defaultOptions, this.options),
                    data: {
                        labels: this.options.labels,
                        datasets: this.data
                    }
                });
            }
        }
    }

    /**
     * sets the background color, border color, border width, etc..
     * @param Array datasets - chartjs datasets
     */
    updateDatasets(datasets) {

        this._meta = {
            colors: this.colors.concat()
        };

        const multiColor = (this.chartType === 'bar' || this.chartType === 'doughnut') && datasets.length === 1 ? true : false;
        datasets.forEach((dataset, i) => {
            this.setColor(dataset, multiColor ? dataset.data.length : 1 );
        });

    }

    setColor( dataset, n ) {
            const colors = dataset.backgroundColor || this.getColors(n);
            dataset.backgroundColor = this.getAlpha(colors.concat([]), 0.5);
            dataset.borderWidth = 1;
            dataset.borderColor = colors;
    }


    getColor() {
        const color = this._meta.colors.shift() || this.getRandomColor(null);
        return color;
    }

    getColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++ ) {
            colors.push(this.getColor());
        }
        return colors;
    }

    getAlpha(colors , alpha ) {
        if ( Array.isArray (colors) ) {
            for ( let i = 0; i < colors.length; i++ ) {
                colors[i] = Chart.helpers.color( colors[i] ).alpha(alpha).rgbString();
            }
        } else {
            colors = Chart.helpers.color( colors ).alpha(alpha).rgbString();
        }
        return colors;
    }

    getRandomColor(color) {
        let hue = this.getRandomInt(0, 360);

        if ( color ) {
            const num = parseInt(color, 16);
            const r = ( ( num >> 16 ) & 255 ) / 255;
            const g = ( ( num >> 8 ) & 255 ) / 255;
            const b = ( num & 255 ) / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const diff = max - min;

                hue =   min === max ? 0 : r === max ?  (((60 * (g - b)) / diff) + 360) % 360
                                : g === max ?      ((60 * (b - r)) / diff) + 120
                                :  ((60 * (r - g)) / diff) + 240;

        }
        return 'hsl(' + hue + ',' + this.getRandomInt(0, 100) + '%,' + this.getRandomInt(0, 90) + '%)';
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    ngOnDestroy() {

    }

}
