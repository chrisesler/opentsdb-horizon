import { Component, Inject, OnInit, OnDestroy, HostBinding, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, DialogPosition } from '@angular/material';

import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
    selector: 'app-search-metrics-dialog',
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

    constructor(
        public dialogRef: MatDialogRef<SearchMetricsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    ngOnInit() {
        console.log('DIALOG DATA', this.data);
        console.log('DIALOG REF', this.dialogRef);

        // parse the incoming data FIRST

        // setup filter options based on input changes
        this.filteredNamespaceOptions = this.namespaceControl.valueChanges
            .pipe(
                startWith(''),
                map(val => this.filterNamespace(val))
            );
    }

    ngOnDestroy() { }

    /**
     * * Namespace options filter
     * * Fills the options of the autocomplete
     *
     * TODO: wire this up to a service to fetch options
     *
     */
    filterNamespace(val: string): string[] {
        // check if the input is greater than 3 characters before returning options to autocomplete
        // NOTE: Doing this so autocomplete doesn't pop open immediately on input focus

        console.log(' **** ', this.namespaceControl);
        if (!this.namespaceControl.value || this.namespaceControl.value && this.namespaceControl.value.length < 2) {
            return;
        }
        return this.fakeNamespaceOptions.filter(option => {
            return option.toLowerCase().includes(val.toLowerCase());
        });
    }

    /**
     * * Remove the selected selected namespace
     */
    removeNamespace() {
        this.selectedNamespace = null;
    }

    /**
     * * If user hits enter, and input is valid and not empty,
     * * then set the selected namespace
     */
    namespaceKeydown(event: any) {
        console.log('NAMESPACE KEYDOWN', event, this.namespaceControl);
        if (this.namespaceControl.valid && this.namespaceControl.value.length > 0) {
            // TODO: check if it is really valid
            this.selectedNamespace = this.namespaceControl.value;
        }
    }

    /**
     * * Event fired when an autocomplete option is selected
     */
    namespaceOptionSelected(event: any) {
        console.log('NAMESPACE OPTION SELECTED', event);
        this.selectedNamespace = event.option.value;
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
            data: this.data
        });
        this.dialogRef.close({ result: this.data });
    }

}

