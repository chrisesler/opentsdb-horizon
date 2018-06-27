import { Component, Inject, OnInit, OnDestroy, HostBinding, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, DialogPosition } from '@angular/material';

import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HttpService } from '../../../../../core/http/http.service';

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
    searchFlag: string = '0';
    results: any[];
    selectedResultSet: any;
    selectedMetrics: any[];
    // properties for dygraph chart preview
    chartType: string = 'line';
    options: any;
    data: any;
    size: any;

    constructor(
        public dialogRef: MatDialogRef<SearchMetricsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialog_data: any,
        private httpService: HttpService
    ) { }

    ngOnInit() {
        this.queryObj = {
            flag: this.searchFlag,
            term: this.searchQueryControl.value
        };
        //console.log('DIALOG DATA', this.data);
        //console.log('DIALOG REF', this.dialogRef);

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

    listSelectedTag(selectedTag: any) {
        this.selectedResultSet = selectedTag;
    }

    selectMetric(metric: any) {
        console.log('select metric', metric);
        
    }

    /**
     * * Click behaviors
     */

    onClick_Cancel(): void {
        console.log('****** CANCEL ********');
        this.dialogRef.close();
    }

    /**
     * ? Not sure the emit is needed, as the dialog close can return data
     */
    onClick_Apply(): any {
        console.log('****** APPLY ********');

        // NOTE: Not sure emit is needed. Might be ok to just pass data from the close action.
        this.onDialogApply.emit({
            action: 'applyDialog',
            data: this.dialog_data
        });
        this.dialogRef.close({ result: this.dialog_data });
    }

}

