import {
    Component, OnInit, HostBinding, Inject, OnDestroy, ViewChild
} from '@angular/core';
import { ISLAND_DATA } from '../../info-island.tokens';
import { IntercomService } from '../../../../../core/services/intercom.service';
import { Subscription } from 'rxjs';
import { MatTableDataSource, MatTable, MatSort } from '@angular/material';
import { FormControl } from '@angular/forms';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'timeseries-legend-component',
    templateUrl: './timeseries-legend.component.html',
    styleUrls: []
})
export class TimeseriesLegendComponent implements OnInit, OnDestroy {

    @HostBinding('class.timeseries-legend-component') private _hostClass = true;

    @ViewChild('legendTable', {read: MatTable}) legendTable: MatTable<any>;

    @ViewChild(MatSort) sort: MatSort;

    /** Subscription handler */
    private subscription: Subscription = new Subscription();

    /** Local Variables */
    currentWidgetId: string = '';

    options: any = {
        trackMouse: false,
        open: false
    };
    data: any;

    dataLimitTypes: string[] = ['Top', 'Bottom', 'All'];

    dataLimitType = 'All'; // all || top |\ bottom
    showAmount: FormControl = new FormControl(50);

    logScaleY1 = false;
    logScaleY2 = false;

    /** Table Stuff */
    tableColumns: string[] = [];
    tableDataSource: MatTableDataSource<any[]> = new MatTableDataSource<any[]>([]);
    resultTagKeys: string[] = [];

    constructor(
        private interCom: IntercomService,
        @Inject(ISLAND_DATA) private _islandData: any
    ) {

        console.log('INITIAL DATA', _islandData);

        // Set initial incoming data (data from first click that opens island)
        this.currentWidgetId = _islandData.originId;
        this.data = _islandData.data.tsTickData;
        this.setTableColumns();
        this.setTableData();
        this.options.open = true;

        const widgetAxes = _islandData.widget.settings.axes;
        this.logScaleY1 = (widgetAxes.y1 && widgetAxes.y1.hasOwnProperty('logscale')) ? widgetAxes.y1.logscale : false;
        this.logScaleY2 = (widgetAxes.y2 && widgetAxes.y2.hasOwnProperty('logscale')) ? widgetAxes.y2.logscale : false;

        // set subscriptions
        this.subscription.add(this.interCom.requestListen().subscribe(message => {
            switch (message.action) {
                case 'tsLegendWidgetSettingsResponse':
                    console.log('tsLegendWidgetSettingsResponse', message);
                    const axes = message.payload.axes;
                    this.logScaleY1 = (axes.y1.hasOwnProperty('logscale')) ? axes.y1.logscale : false;
                    this.logScaleY2 = (axes.y2.hasOwnProperty('logscale')) ? axes.y2.logscale : false;
                    break;
                case 'tsTickDataChange':
                    if (this.currentWidgetId !== message.id) {
                        // request widget settings
                        // need this for axis logscale settings
                        this.interCom.requestSend({
                            id: message.id,
                            action: 'tsLegendRequestWidgetSettings'
                        });
                    }
                    this.currentWidgetId = message.id;
                    this.data = message.payload;
                    this.setTableColumns();
                    this.setTableData();
                    break;
                default:
                    break;
            }
        }));

        this.subscription.add(this.showAmount.valueChanges.subscribe(value => {
            if (this.dataLimitType !== 'All') {
                // console.log('show amount changes', value);
                // trigger some data filtering
                this.setTableData();
            }
        }));

        // interCom out the options
        this.interCom.responsePut({
            action: 'tsLegendOptionsChange',
            payload: this.options
        });

    }

    ngOnInit() {
        this.tableDataSource.sort = this.sort;
        this.tableDataSource.sortingDataAccessor = (item: any, property: any) => {
            if (property === 'value') {
                return item.data.yval;
            } else {
                return item[property];
            }
        };
    }

    /** Toolbar controls */
    trackmouseCheckboxChange(event: any) {
        console.log('trackmouse', event);

        // update options, then interCom requestSend change
        this.options.trackMouse = event.checked;
        this.interCom.responsePut({
            action: 'tsLegendOptionsChange',
            payload: this.options
        });
    }

    logscaleCheckboxChange(axis: string, value: boolean) {
        if (axis === 'y1') {
            this.logScaleY1 = value;
        }

        if (axis === 'y2') {
            this.logScaleY2 = value;
        }

        // need to interCom to widget to update logScale
        this.interCom.responsePut({
            action: 'tsLegendLogscaleChange',
            id: this.currentWidgetId,
            payload: {
                y1: this.logScaleY1,
                y2: this.logScaleY2
            }
        });
    }

    dataLimitTypeChange(value: string) {
        this.dataLimitType = value;
        // trigger some sort of data filtering here
        this.setTableData();
    }

    /** Table controls & functions */

    onMatSortChange(event: any) {
        console.log('SORT CHANGE', event);
        // trigger some sort of data filtering?
        this.setTableData();
    }

    private setTableColumns() {
        // columns always start with these
        let columns = ['checkbox', 'metricName'];

        // extract tags
        // NOTE: making assumption common tags are already in all data series
        let tagKeys = [];
        if (this.data.series.length > 0) {
            tagKeys = Object.keys(this.data.series[0].series.tags);
        }

        columns = columns.concat(tagKeys, ['value']);
        this.resultTagKeys = tagKeys;
        this.tableColumns = columns;
    }

    private setTableData() {
        if (this.data.series.length === 0) {
            this.tableDataSource.data = [];
        } else {
            // slice for quick array clone
            // go ahead and sort by value so showLimit will show correctly
            const isAsc = (this.sort) ? this.sort.direction === 'asc' : false;
            const newDataArray: any[] = this.data.series.slice().sort((a, b) => {
                return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
            });
            const showLimit = this.showAmount.value;

            switch (this.dataLimitType) {
                case 'Top':
                    this.tableDataSource.data = (newDataArray.length < showLimit) ? newDataArray : newDataArray.slice(0, showLimit);
                    break;
                case 'Bottom':
                    this.tableDataSource.data = (newDataArray.length < showLimit) ? newDataArray : newDataArray.slice(newDataArray.length - showLimit, newDataArray.length);
                    break;
                default:
                    this.tableDataSource.data = newDataArray;
                    break;
            }
        }
        if (this.legendTable) {
            this.legendTable.renderRows();
        }
    }

    // because our data columns sometimes use nested data to display,
    // we have to use a sort accessor depending on column to
    // return correct data to sort against
    sortAccessor(item, property) {
        console.log('SORT ACCESSOR', item, property);
        if (property === 'value') {
            return item.data.yval;
        } else {
            return item[property];
        }
    }

    /** OnDestory - Always Last */
    ngOnDestroy() {
        this.subscription.unsubscribe();

        // interCom options out that it has closed so graphs won't still be emitting tickdata
        this.options.open = false;
        this.interCom.responsePut({
            action: 'tsLegendOptionsChange',
            payload: this.options
        });
    }

}
