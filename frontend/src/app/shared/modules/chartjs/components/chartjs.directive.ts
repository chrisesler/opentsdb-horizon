import { OnInit, OnChanges, OnDestroy, Directive,
    Input, Output, EventEmitter, ElementRef, SimpleChanges } from '@angular/core';
import { Chart } from 'chart.js';

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

    constructor(private element: ElementRef) { }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        console.log("chartjs", changes);
        if ( changes ) {
            if ( !this.chart && this.data ) {
                let ctx = this.element.nativeElement.getContext('2d');
                this.chart = new Chart(ctx, {
                    type: this.chartType,
                    options: Object.assign(this.defaultOptions, this.options),
                    data: {
                        datasets: this.data
                    }
                });
            } else if ( this.chart && changes.data && changes.data.currentValue ) {
                const data = changes.data.currentValue;
                this.chart.data.datasets.forEach((dataset) => {
                    dataset.data.pop();
                });
                // sets the background color, border color, width, etc..
                this.updateDatasets(this.data);
                data.forEach((dataset, i) => {
                    this.chart.data.datasets[i] = dataset;
                });
                this.chart.options.scales.xAxes[0].labels = this.options.scales.xAxes[0].labels;
                this.chart.update(0);
            }
        }
    }

    updateDatasets(datasets) {
        this._meta = {
            colors: this.colors.concat()
        };
        datasets.forEach((dataset, i) => {
            this.setColor(dataset);
        });
    }

    setColor(dataset) {
        if ( this.chartType === 'bar' || this.chartType === 'doughnut') {
            const colors = dataset.color || this.getColors(dataset.data.length);
            dataset.backgroundColor = this.getAlpha(colors.concat([]), 0.5);
            dataset.borderWidth = 1;
            dataset.borderColor = colors;
        }
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
