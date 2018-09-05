import { Component, Inject, OnInit, OnDestroy, HostBinding, EventEmitter, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, DialogPosition, MatSort, MatTableDataSource } from '@angular/material';

import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HttpService } from '../../../../../core/http/http.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { IDygraphOptions } from '../../../dygraphs/IDygraphOptions';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'search-metrics-dialog',
    templateUrl: './search-metrics-dialog.component.html',
    styleUrls: []
})
export class SearchMetricsDialogComponent implements OnInit, OnDestroy {
    @HostBinding('class.search-metrics-dialog') private _hostClass = true;

    // TODO: Add sort functionality to table
    /*_sort: MatSort;
    @ViewChild(MatSort)
    set sort(item: MatSort) {
        console.log(item);
        this._sort = item;
    }
    get sort(): MatSort {
        return this._sort;
    }*/

    selectedNamespace: String | null;

    // form controls
    namespaceControl: FormControl = new FormControl();
    searchQueryControl: FormControl = new FormControl();

    // FAKE DATA
    fakeNamespaceOptions = [
        'FLICKR',
        'FLURRY',
        'MAIL',
        'MAIL-JEDI',
        'UDB',
        'UDS',
        'YAMAS',
    ];
    filteredNamespaceOptions: Observable<string[]>;
    onDialogApply = new EventEmitter();
    queryObj: any;
    // tslint:disable-next-line:no-inferrable-types
    searchFlag: string = '0'; // ? what are possible values ? is this the 'display results by' values?

    // all results?
    results: any[];
    resultCount: any = 0;

    // the result set selected based on the tag key from left column
    selectedResultSet: any;

    // TODO: add sort functionality to table
    // sortableResultSet: any;

    // once a result set is selected, then parse the common/uncommon tags into this variable
    // common meaning ALL results have that tag, uncommon is the rest
    selectedResultSetTagKeys: any; // {common: [], uncommon: []}

    // table columns for result table
    // selectMetric: placeholder for the 'add metric (plus)' button
    // metric, host, color, hostgroup: whitelist of tags we display by default
    // ... at least until I can dynamically feed the columns from the extracted common keys
    // other: column to list the remaining uncommon tags
    // TODO: remove this since we have a dynamic table working
    // resultTableColumns: any[] = ['selectMetric', 'metric', 'host', 'colo', 'hostgroup', 'other'];

    // the actual metrics you have selected for the temp graph
    selectedMetrics: any[] = [];
    group: any = {
        id: '',
        metrics: []
    };
    // properties for dygraph chart preview
    // tslint:disable-next-line:no-inferrable-types
    chartType: string = 'line';
    options: IDygraphOptions = {
        labels: ['x'],
        connectSeparatedPoints: true,
        drawPoints: false,
        labelsDivWidth: 0,
        legend: 'never',
        stackedGraph: true,
        hightlightCircleSize: 1,
        strokeWidth: 1,
        strokeBorderWidth: 1,
        highlightSeriesOpts: {
            strokeWidth: 3,
            strockeBorderWidth: 1,
            hightlightCircleSize: 5
        }
    };
    data: any = [[0]];
    size: any = {};

    // passing data to dialog using @Inject
    constructor(
        public dialogRef: MatDialogRef<SearchMetricsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialog_data: any,
        private httpService: HttpService,
        private dataTransformerService: DatatranformerService
    ) {
        console.log('passing data', this.dialog_data);
        if (this.dialog_data.mgroupId === undefined) {
            // we will create new groups based on number of metrics
            this.group.id = 'new'; // need to generate them later
        } else {
            // adding metric to selected group
            this.group.id = this.dialog_data.mgroupId;
        }
    }

    ngOnInit() {
        this.queryObj = {
            flag: this.searchFlag,
            term: this.searchQueryControl.value
        };
        // console.log('DIALOG DATA', this.data);
        // console.log('DIALOG REF', this.dialogRef);

        // setup filter options observable based on input changes
        this.filteredNamespaceOptions = this.namespaceControl.valueChanges
            .pipe(
                startWith(''),
                map(val => this.filterNamespace(val))
            );
        this.httpService.getMetrics({namespace: 'mail-jedi', searchPattern: 'sys'}).subscribe(res => {
            console.log('metric results=', res);
        });
    }

    ngOnDestroy() { }

    filterNamespace(val: string): string[] {
        return this.fakeNamespaceOptions.filter(option => {
            return option.toLowerCase().includes(val.toLowerCase());
        });
    }

    /**
     * * If user hits enter, the input is valid and that option must exist in the list
     */
    namespaceKeydown(event: any) {
        if (this.namespaceControl.valid && this.fakeNamespaceOptions.includes(this.namespaceControl.value)) {
            this.selectedNamespace = this.namespaceControl.value;
        }
    }
    /**
     * * Event fired when an autocomplete option is selected
     */
    namespaceOptionSelected(event: any) {
        this.selectedNamespace = event.option.value;
    }

    // when user hit enter to search
    submitSearch(event: any) {
        this.queryObj.term = this.searchQueryControl.value;
        if (this.queryObj.term !== '') {
            this.httpService.searchMetrics(this.queryObj).subscribe(
                resp => {
                    console.log('resp', resp);
                    this.resultCount = resp.raw.length;
                    this.results = resp.results;
                },
                err => {
                    console.log('error', err);
                }
            );
        }
    }
    // handle when clicked on tags (left)
    listSelectedTag(selectedTag: any) {
        // extract unique keys
        this.selectedResultSetTagKeys = this.extractUniqueKeys(selectedTag.values);
        // change selectedResultSet
        this.selectedResultSet = selectedTag;

        // TODO: add sort functionality to table
        // console.log('SORT', this.sort);
        // this.selectedResultSet.values = new MatTableDataSource(this.selectedResultSet.values.splice(0));
        // this.selectedResultSet.values.sort = this.sort;
    }
    // handle when clicked to select a metric
    // should we check duplicate or same set of tags?
    selectMetric(m: any) {
        console.log("metric=", m)
        if (!this.isMetricExit(m)) {
            this.selectedMetrics.push(m);
            let mf = {...m, metric: this.selectedNamespace + '.' + m.metric };
            mf = this.dataTransformerService.buildMetricObject(mf);
            this.group.metrics.push(mf);
            this.getYamasData(this.group.metrics);
        }
    }

    // to get query for selected metrics, my rebuild to keep time sync 1h-ago
    getYamasData(metrics: any[]) {

        const query = {
            start: '1h-ago',
            queries: metrics
        };
        console.log("query", query);

        this.httpService.getYamasData(query).subscribe(
            result => {
                const groupData = {};
                groupData[this.group.id] = result;
                this.data = this.dataTransformerService.yamasToDygraph(this.options, [[0]] , groupData);
            },
            err => {
                console.log('error', err);
            }
        );
    }

    // check if the metric is already added
    isMetricExit(metric: any): boolean {
        for (let i = 0; i < this.selectedMetrics.length; i++) {
            if (JSON.stringify(metric) === JSON.stringify(this.selectedMetrics[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * utilities
     */

    // TODO: Eventually add sorting to table
    sortResultTable(event: any) {
        console.log('SORT EVENT', event);
    }

    // extract just the keys
    extractMetricTagKeys(metric: any, withoutMetric?: boolean) {
        const objKeys = Object.keys(metric);
        // remove "metric"?
        if (withoutMetric) {
            const idx = objKeys.indexOf(metric);
            objKeys.splice(idx, 1);
        }
        return objKeys;
    }

    // this function extracts unique keys, and sorts them based on commonality
    // returns a object {common: [], uncommon: []}
    extractUniqueKeys(data: any) {
        let commonProps = [];   // array of tag keys that are common in ALL the data items
        let uncommonProps = []; // array of the remainder of possible tag keys (but NOT common to all metrics)

        const ignoredProps = ['_aggregate', '_threshold_name'];

        const values = {};      // list of tag keys
        const weights = {};     // list of the number of occurences of tag keys

        function isArray(item) {
            return Object.prototype.toString.call(item) === '[object Array]';
        }

        // tslint:disable-next-line:no-shadowed-variable
        function getProps(item, map, counts) {
            if (typeof item === 'object') {
                if (isArray(item)) {
                    // iterate through all array elements
                    for (let i = 0; i < item.length; i++) {
                        getProps(item[i], map, counts);
                    }
                } else {
                    for (const prop in item) {
                        if (prop in item) {
                            // ignore 'metric', since it will always be first
                            if (prop === 'metric' || ignoredProps.includes(prop)) { continue; }

                            // add property to map
                            // TODO: check this against whitelist before adding?
                            map[prop] = true;
                            // check if it exists in the weights map
                            if (!counts[prop]) {
                                counts[prop] = 0;
                            }
                            // increment weight
                            counts[prop]++;
                            // recursively get any nested props
                            // if this turns out to be an object or array
                            getProps(item[prop], map, counts);
                        }
                    }
                }
            }
        }

        // parse the properties
        getProps(data, values, weights);

        // NOW to get commonality
        const ukeys = Object.keys(weights);

        // sort so highest weights are first so we can filter out common/uncommon props
        ukeys.sort(function(a, b) {
            const x = weights[a];
            const y = weights[b];
            return x < y ? 1 : x > y ? -1 : 0;
        });

        // everything that has the same highest weights are common
        // comparison is with the first item in sorted array since it was sorted based on highest weights first
        commonProps = ukeys.filter(b => weights[b] === weights[ukeys[0]]);

        // splice it, so remainder is uncommon props
        uncommonProps = ukeys.splice(commonProps.length);

        // make sure 'metric' is pushed onto front
        commonProps.unshift('metric');

        // console.log('%cDATA', 'font-weight: bold; color: lime', data, values, weights, ukeys);
        // console.log('commonProps', commonProps, uncommonProps, ukeys);

        // displayed columns for the table
        const displayedColumns = commonProps.slice(0);
        // selectMetric column is first so we can add the buttons to select the metric
        displayedColumns.unshift('selectMetric');
        // if there are uncommon tags, then lets push on 'other'
        if (uncommonProps.length > 0) {
            displayedColumns.push('other');
        }

        return { common: commonProps, uncommon: uncommonProps, displayed: displayedColumns };
    }

    removeSelectedMetric(metric: any) {
        // remove item from selected metrics
        this.selectedMetrics.splice(this.selectedMetrics.indexOf(metric), 1);
        // NOTE: Need to also remove it from the group?
    }

    /**
     * Behaviors
     */

    click_changeSearchFlag(val: string) {
        this.searchFlag = val;
    }

    // handle when clicked on cancel
    onClick_Cancel(): void {
        this.dialogRef.close();
    }

    // handle when clicked on apply
    onClick_Apply(): any {
        // NOTE: Not sure emit is needed. Might be ok to just pass data from the close action.
        // this.onDialogApply.emit({
        //    action: 'applyDialog',
        //    data: this.dialog_data
        // });
        this.dialogRef.close({ mgroup: this.group });
    }

}

