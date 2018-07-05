import { Component, Inject, OnInit, OnDestroy, HostBinding, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, DialogPosition } from '@angular/material';

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
    searchFlag: string = '0';
    results: any[];
    selectedResultSet: any;
    selectedResultSetTagKeys: any;

    resultTableColumns: any[] = ['selectMetric', 'metric', 'host', 'colo', 'hostgroup', 'other'];
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
    data: any;
    size: any;

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
        this.selectedResultSet = selectedTag;
        console.log('RESULT SET TAG KEYS', this.selectedResultSetTagKeys);
    }
    // handle when clicked to select a metric
    // should we check duplicate or same set of tags?
    selectMetric(m: any) {
        if (!this.isMetricExit(m)) {
            this.selectedMetrics.push(m);
            const mf = {...m, metric: this.selectedNamespace + '.' + m.metric };
            this.group.metrics.push(mf);
            this.getYamasData(this.group.metrics);
        }
    }

    // to get query for selected metrics, my rebuild to keep time sync 1h-ago
    getYamasData(metrics: any[]) {

        const query = this.dataTransformerService.buildAdhocYamasQuery(metrics);

        this.httpService.getYamasData(query).subscribe(
            result => {
                console.log('result', result);
                this.data = this.dataTransformerService.yamasToDygraph(this.options, result);
                console.log('this options', this.options);
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

    extractMetricTagKeys(metric: any, withoutMetric?: boolean) {
        const objKeys = Object.keys(metric);
        // remove "metric"?
        if (withoutMetric) {
            const idx = objKeys.indexOf(metric);
            objKeys.splice(idx, 1);
        }
        return objKeys;
    }

    extractUniqueKeys(data: any) {
        let commonProps = []; // array of tag keys that are common in ALL the data items
        let uncommonProps = []; // array of the remainder of possible tag keys (but NOT common to all metrics)

        const values = {}; // list of tag keys
        const weights = {}; // list of the number of occurences of tag keys
        // console.log('%cDATA', 'font-weight: bold; color: lime', data);

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
                            if (prop === 'metric') { continue; }

                            map[prop] = true;
                            if (!counts[prop]) {
                                counts[prop] = 0;
                            }
                            counts[prop]++;
                            // recursively get any nested props
                            // if this turns out to be an object or array
                            getProps(item[prop], map, counts);
                        }
                    }
                }
            }
        }

        getProps(data, values, weights);

        // NOW to get commonality
        const ukeys = Object.keys(weights);

        // sort so highest weights are first so we can filter out common props
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

        // commonProps = getProps(data, map1);

        // console.log('%cDATA', 'font-weight: bold; color: lime', data, values, weights, ukeys);
        console.log('commonProps', commonProps, uncommonProps, ukeys);


        return { common: commonProps, uncommon: uncommonProps };
    }

    /**
     * Behaviors
     */

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

