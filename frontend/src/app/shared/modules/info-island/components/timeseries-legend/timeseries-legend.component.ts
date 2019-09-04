import {
    Component, OnInit, HostBinding, Inject, OnDestroy, ViewChild, Renderer2, ElementRef
} from '@angular/core';
import { ISLAND_DATA } from '../../info-island.tokens';
import { IntercomService } from '../../../../../core/services/intercom.service';
import { Subscription } from 'rxjs';
import { MatTableDataSource, MatTable, MatSort } from '@angular/material';
import { FormControl } from '@angular/forms';
import { LoggerService } from '../../../../../core/services/logger.service';
import { CdkObserveContent } from '@angular/cdk/observers';
import { InfoIslandComponent } from '../../containers/info-island.component';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'timeseries-legend-component',
    templateUrl: './timeseries-legend.component.html',
    styleUrls: []
})
export class TimeseriesLegendComponent implements OnInit, OnDestroy {

    @HostBinding('class.timeseries-legend-component') private _hostClass = true;

    @ViewChild('legendTable', {read: MatTable}) private _legendTable: MatTable<any>;
    @ViewChild('legendTable', {read: ElementRef}) private _legendTableEl: ElementRef<any>;
    @ViewChild('legendTable', {read: CdkObserveContent}) private _legendTableObserve: CdkObserveContent;
    @ViewChild(MatSort) sort: MatSort;

    islandRef: InfoIslandComponent;

    /** Subscription handler */
    private subscription: Subscription = new Subscription();

    /** Local Variables */
    currentWidgetId: string = '';
    currentWidgetOptions: any = {};
    currentWidgetType: string = '';

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

    masterChecked = false;
    masterIndeterminate = false;

    multigraph: any = false;

    private tableListen;

    constructor(
        private logger: LoggerService,
        private interCom: IntercomService,
        private renderer: Renderer2,
        @Inject(ISLAND_DATA) private _islandData: any
    ) {

        // ('INITIAL DATA', _islandData);

        // Set initial incoming data (data from first click that opens island)
        this.currentWidgetId = _islandData.originId;
        this.currentWidgetType = _islandData.widget.settings.component_type;
        this.currentWidgetOptions = _islandData.data.options;
        this.multigraph = _islandData.data.multigraph;
        this.data = _islandData.data.tsTickData;
        this.setTableColumns();
        this.setTableData();
        this.options.open = true;

        if (this.multigraph) {
            this.interCom.responsePut({
                id: this.currentWidgetId,
                action: 'tsLegendFocusChange',
                payload: this.multigraph
            });
        } else {
            this.interCom.responsePut({
                id: this.currentWidgetId,
                action: 'tsLegendFocusChange',
                payload: true
            });
        }

        const widgetAxes = _islandData.widget.settings.axes || {};
        this.logScaleY1 = (widgetAxes.y1 && widgetAxes.y1.hasOwnProperty('logscale')) ? widgetAxes.y1.logscale : false;
        this.logScaleY2 = (widgetAxes.y2 && widgetAxes.y2.hasOwnProperty('logscale')) ? widgetAxes.y2.logscale : false;

        // set subscriptions
        this.subscription.add(this.interCom.requestListen().subscribe(message => {
            // this.logger.log('TSL INTERCOM LISTEN', message);
            switch (message.action) {
                case 'tsLegendWidgetOptionsUpdate':
                    this.currentWidgetOptions = message.payload.options;
                    this.updateMasterCheckboxStates();
                    break;
                case 'tsLegendWidgetSettingsResponse':
                    // console.log('tsLegendWidgetSettingsResponse', message);
                    this.currentWidgetOptions = message.payload.options;
                    const settings = message.payload.settings;
                    this.currentWidgetType = settings.component_type;
                    const axes = settings.axes;
                    this.logScaleY1 = (axes.y1.hasOwnProperty('logscale')) ? axes.y1.logscale : false;
                    this.logScaleY2 = (axes.y2.hasOwnProperty('logscale')) ? axes.y2.logscale : false;
                    this.updateMasterCheckboxStates();
                    break;
                case 'tsTickDataChange':
                    // if the incoming message has a trackMouse property, it came from a click that is resetting it
                    // otherwise if the local options.trackMouse is true, compare the widget ids
                    if (
                        (message.payload.trackMouse) ||
                        (this.options.trackMouse && (this.currentWidgetId === message.id) && (!this.multigraph || (this.multigraph && (this.multigraph.y === message.payload.multigraph.y) && (this.multigraph.x === message.payload.multigraph.x))))
                    ) {
                        let newOptionsNeeded = false;
                        // if new widget, then get new options
                        if (this.currentWidgetId !== message.id) {
                            //this.masterIndeterminate = false;
                            newOptionsNeeded = true;
                        } else if (message.payload.multigraph) {
                            if (this.multigraph && (this.multigraph.y !== message.payload.multigraph.y || this.multigraph.x !== message.payload.multigraph.x)) {
                                this.masterIndeterminate = false;
                                // this.logger.error('DIFFERENT MULTIGRAPH GRAPH', message);
                                newOptionsNeeded = true;
                            }
                        }
                        
                        if (message.payload.trackMouse) {
                            this.trackmouseCheckboxChange(message.payload.trackMouse);
                        }
                        this.currentWidgetId = message.id;
                        this.multigraph = message.payload.multigraph;
                        this.data = message.payload.tickData;
                        this.setTableColumns();
                        this.setTableData();
                        // need new options
                        if (newOptionsNeeded) {
                            // this.logger.error('DIFFERENT WIDGET', message);
                            // request widget settings
                            // need this for axis logscale settings
                            this.interCom.responsePut({
                                id: message.id,
                                action: 'tsLegendRequestWidgetSettings',
                                payload: {
                                    multigraph: this.multigraph
                                }
                            });
                            this._legendTableObserve.disabled = false;
                        }
                        // focus change
                        if (this.multigraph) {
                            this.interCom.responsePut({
                                id: this.currentWidgetId,
                                action: 'tsLegendFocusChange',
                                payload: this.multigraph
                            });
                        } else {
                            this.interCom.responsePut({
                                id: this.currentWidgetId,
                                action: 'tsLegendFocusChange',
                                payload: true
                            });
                        }
                    }
                    break;
                default:
                    break;
            }
        }));

        this.subscription.add(this.showAmount.valueChanges.subscribe(val =>{
            this.setTableData();
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
        // console.log('trackmouse', event);

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

    tableContentChanged(event: any) {
        // console.log('TABLE CONTENT CHANGED', event);
        // calculate size of table
        const tableSize: DOMRect = this._legendTableEl.nativeElement.getBoundingClientRect();
        // console.log('TABLE SIZE', tableSize);

        // attempt to tell island window of potential minimum size to open with all data visible
        this.islandRef.updateSize(tableSize);

        // then disable this watcher
        this._legendTableObserve.disabled = true;
    }

    onMatSortChange(event: any) {
        // console.log('SORT CHANGE', event);
        // trigger some sort of data filtering?
        this.setTableData();
    }

    private setTableColumns() {
        // columns always start with these
        let columns = ['checkbox', 'metric'];

        // extract tags, excluding 'metric' as we already set it after 'checkbox'
        // NOTE: making assumption common tags are already in all data series
        let tagKeys = [];
        if (this.data.series.length > 0) {
            tagKeys = Object.keys(this.data.series[0].series.tags).filter(tag => tag !== 'metric');
        }

        columns = columns.concat(tagKeys, ['value']);
        this.resultTagKeys = tagKeys;
        this.tableColumns = columns;
    }

    private setTableData() {
        if (this.data.series.length === 0) {
            this.tableDataSource.data = [];
        } else {
            for (const index in this.data.series) {
                if (this.data.series[index]) {
                    // tslint:disable-next-line: radix
                    this.data.series[index]['srcIndex'] = parseInt(index);
                    this.data.series[index]['visible'] = this.currentWidgetOptions.visibility[this.data.series[index].srcIndex];
                }
            }

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
        this.updateMasterCheckboxStates();
        if (this._legendTable) {
            this._legendTable.renderRows();
        }
    }

    // because our data columns sometimes use nested data to display,
    // we have to use a sort accessor depending on column to
    // return correct data to sort against
    sortAccessor(item, property) {
        // console.log('SORT ACCESSOR', item, property);
        if (property === 'value') {
            //return item.data.yval;
            return item.formattedValue;
        } else {
            return item[property];
        }
    }

    /* table checkbox controls */
    private updateMasterCheckboxStates() {
        let visCount = 0;
        // console.log('UPDATE MASTER CHECKBOX STATES', this.tableDataSource.data);
        for (let i = 0; i < this.tableDataSource.data.length; i++) {
            const item: any = this.tableDataSource.data[i];
            const srcIndex = item.srcIndex;
            //console.log('ITEM CHECK', srcIndex, item, this.currentWidgetOptions.visibility[srcIndex]);
            if (this.currentWidgetOptions.visibility[srcIndex] === true) {
                visCount++;
            }
        }

        const indeterminateCheck = (visCount < this.tableDataSource.data.length && visCount > 0) ? true : false;
        if (this.masterIndeterminate !== indeterminateCheck) {
            this.masterIndeterminate = (visCount < this.tableDataSource.data.length && visCount > 0) ? true : false;
        }
        // need to timeout slightly to let indeterminate to set first, otherwise it would cancel out masterChecked (if true)
        setTimeout(() => {
            this.masterChecked = (visCount === 0) ? false : (visCount === this.tableDataSource.data.length) ? true : false;
        }, 50);
        /*console.log ('FINAL CHECK', {
            visCount,
            tableLength: this.tableDataSource.data.length,
            checked: this.masterChecked,
            indeterminate: this.masterIndeterminate
        });*/
    }

    // master checkbox change
    masterCheckboxClick($event) {
        /*console.log('MASTER CHECKBOX CHANGE', {
            checked: this.masterChecked,
            indeterminate: this.masterIndeterminate
        });*/
        const checked = this.masterChecked;
        const indeterminate = this.masterIndeterminate;

        if (!checked && !indeterminate) {
            // everything is not visible
            // need to toggle everything to be turned on
            this.interCom.responsePut({
                id: this.currentWidgetId,
                action: 'tsLegendToggleSeries',
                payload: {
                    visible: true,
                    batch: <number[]>this.tableDataSource.data.map((item: any) => item.srcIndex),
                    multigraph: this.multigraph
                }
            });
        } else if (checked && !indeterminate) {
            // everything is visible
            // need to toggle everything to turn off
            this.interCom.responsePut({
                id: this.currentWidgetId,
                action: 'tsLegendToggleSeries',
                payload: {
                    visible: false,
                    batch: <number[]>this.tableDataSource.data.map((item: any) => item.srcIndex),
                    multigraph: this.multigraph
                }
            });
        } else {
            // indeterminate
            // partial not visible
            // need to turn those on
            const notVisible = this.tableDataSource.data.filter((item: any) => !this.currentWidgetOptions.visibility[item.srcIndex]);
            //console.log('=== NOT VISIBLE ===', notVisible);

            this.interCom.responsePut({
                id: this.currentWidgetId,
                action: 'tsLegendToggleSeries',
                payload: {
                    visible: true,
                    batch: <number[]>notVisible.map((item: any) => item.srcIndex),
                    multigraph: this.multigraph
                }
            });
        }
    }

    // single table row checkbox
    timeSeriesVisibilityToggle(srcIndex: any, event: any) {
        const itemIndex = this.tableDataSource.data.findIndex((item: any) => item.srcIndex === srcIndex);
        (<any>this.tableDataSource.data[itemIndex]).visible = event.checked;

        /*this.interCom.responsePut({
            id: this.currentWidgetId,
            action: 'tsLegendToggleSeries',
            payload: {
                srcIndex: srcIndex,
                focusOnly: false
            }
        });*/
        this.interCom.responsePut({
            id: this.currentWidgetId,
            action: 'tsLegendToggleSeries',
            payload: {
                visible: event.checked,
                batch: [srcIndex],
                multigraph: this.multigraph
            }
        });
    }

    /** OnDestory - Always Last */
    ngOnDestroy() {
        this.subscription.unsubscribe();
        this._legendTableObserve.ngOnDestroy();

        // interCom options out that it has closed so graphs won't still be emitting tickdata
        this.options.open = false;
        this.interCom.responsePut({
            action: 'tsLegendOptionsChange',
            payload: this.options
        });
    }

}
