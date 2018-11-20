import { Component, OnInit, OnChanges, HostBinding, Inject, Input, Output, SimpleChanges, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, switchMap, filter, catchError } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialogRef, DialogPosition } from '@angular/material';

import { HttpService } from '../../../../../core/http/http.service';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  selector: 'inline-query-editor',
  templateUrl: './inline-query-editor.component.html',
  styleUrls: ['./inline-query-editor.component.scss']

})
export class InlineQueryEditorComponent implements OnInit, OnChanges {
    @HostBinding('class.inline-query-editor') private _hostClass = true;
    // @Input() query: any = { metrics: [] , filters: []};
    // @Input() showTag = false;
    @Input() namespace = '';
    // @Input() tagsSelected: any = {};
    // @Output() queryOutput = new EventEmitter();

    @ViewChild('tagValueSearchInput') tagValueSearchInput: ElementRef;
    @ViewChild('tagSearchInput') tagSearchInput: ElementRef;
    @ViewChild('metricSearchInput') metricSearchInput: ElementRef;

    query: any;
    filteredTagOptions: Observable<any>;
    filteredTagValues = [];
    metricOptions = [];
    selectedTag = '';
    selectedTagIndex = -1;
    metricSearchControl: FormControl;
    tagSearchControl: FormControl;
    tagValueSearchControl: FormControl;
    addMetricEnabled = false;
    message = { 'tagControl' : { message: ''}, 'tagValueControl' : { message: '' } };
    Object = Object;

    /*
    nsTagKeys = [];
    tags: any = [];
    namespaceEdit = true;
    showTagControl = false;
    showTagValueControl = false;
    showAddTagBtn = false;
    currentTag = '';
    editTagValue = '';
    */

    constructor(
        public dialogRef: MatDialogRef<InlineQueryEditorComponent>,
        @Inject(MAT_DIALOG_DATA) public dialogData: any,
        private httpService: HttpService,
        private utils: UtilsService ) { 
            console.log('passing data', this.dialogData);
            this.query  = JSON.parse(JSON.stringify(this.dialogData));
            this.setMetricSearch();
            this.setTagSearch();
            this.setTagValueSearch();
        }

    ngOnInit() {
    }

    ngOnChanges( changes: SimpleChanges ) {
        /*
        if ( changes.query && changes.query.currentValue ) {
            console.log("this.query", this.query);
        }
        */
    }

    setMetricSearch() {
        this.metricSearchControl = new FormControl('');
        // need to include switchMap to cancel the previous call
        this.metricSearchControl.valueChanges
        .pipe(
            startWith(''),
            debounceTime(200)
        )
        .subscribe( value => {
            const query: any = { namespace: this.query.namespace, tags: [] };

            for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
                const filter: any =  { key: this.query.filters[i].tagk };
                if ( this.query.filters[i].filter ) {
                    filter.value = this.query.filters[i].filter;
                }
                query.tags.push(filter);
            }

            query.search = value;
            if ( this.addMetricEnabled ) {
                this.httpService.getMetricsByNamespace(query)
                                    .subscribe(res => {
                                        this.metricOptions = res;
                                        this.metricSearchInput.nativeElement.focus();
                                        console.log("metricOptions", this.metricOptions);
                                    });
            }
        });
    }

    setTagSearch() {
        this.tagSearchControl = new FormControl('');
        this.tagSearchControl.valueChanges
        .pipe(
            startWith(''),
            debounceTime(200)
        )
        .subscribe( value => {
            this.selectedTagIndex = -1;
            const query: any = { namespace: this.query.namespace, tags: [] };

            for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
                const filter: any =  { key: this.query.filters[i].tagk };
                if ( this.query.filters[i].filter ) {
                    filter.value = this.query.filters[i].filter;
                }
                query.tags.push(filter);
            }

            query.search = value;

            // filter tags by metrics
            if ( this.query.metrics ) {
                query.metrics = this.query.metrics.map( item => item.name );
            }
            console.log("tag query", query);
            this.httpService.getNamespaceTagKeys(query)
                                                        .pipe(
                                                            // debounceTime(200),
                                                            catchError(val => of(`I caught: ${val}`)),
                                                        ).subscribe( res => {
                                                            console.log("comsd ", res);
                                                            const selected = this.query.filters.map(item => item.tagk);
                                                            res = res.filter( tag => selected.indexOf(tag) === -1);
                                                            res.unshift(...selected);
                                                            this.filteredTagOptions = of(res);
                                                        });
            this.tagSearchInput.nativeElement.focus();
        });
    }

    setTagValueSearch() {
        this.tagValueSearchControl = new FormControl('');

        // need to include switchMap to cancel the previous call
        this.tagValueSearchControl.valueChanges
        .pipe(
            startWith(''),
            debounceTime(200)
        )
        .subscribe( value => {
            const query: any = { namespace: this.query.namespace, tags: [] };

            for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
                const filter: any =  { key: this.query.filters[i].tagk };
                if ( this.query.filters[i].filter.length ) {
                    filter.value = this.query.filters[i].filter;
                }
                query.tags.push(filter);
            }

            query.search = value;

            // filter by metrics
            if ( this.query.metrics ) {
                query.metrics = this.query.metrics.map( item => item.name );
            }
            if ( this.selectedTagIndex !== -1 ) {
                console.log("query tab value", query)
                query.tagkey = this.query.filters[this.selectedTagIndex].tagk;
                this.httpService.getTagValuesByNamespace(query)
                                .subscribe(res => {
                                    const selected = this.query.filters[this.selectedTagIndex].filter;
                                    res = res.filter (v => selected.indexOf(v) === -1);
                                    this.filteredTagValues = res;
                                });
            }
        });
    }

    showMetricAdd() {
        this.addMetricEnabled = true;
        this.metricOptions = [];
        this.metricSearchControl.setValue(null);
    }

    addMetric(metric) {
        console.log('metric=', metric);
        metric = metric.trim();
        if ( metric && this.query.metrics.indexOf(metric) === -1 ) {
            const id = this.utils.generateId();
            const oMetric = { id: id, name: metric, settings: { visual: { visible: true}}};
            this.query.metrics.push(oMetric);
        }
        this.addMetricEnabled = false;
    }
    metricSearchKeydown($event) {
        const value = this.metricSearchControl.value;
        this.addMetric(value);
        console.log($event, this.query.metrics);
    }

    metricOptionSelected(event) {
        this.addMetric(event.option.value);
    }

    loadTagValues( tag ) {
        let index = this.query.filters.findIndex( item => item.filter.tagk === tag );
        if ( index === -1 ) {
            index = this.query.filters.length;
            this.query.filters[index] = { tagk: tag, filter: []};
        }
        this.selectedTagIndex = index;
        this.tagValueSearchControl.setValue(null);
        this.tagValueSearchInput.nativeElement.focus();
    }

    addTagValue(v) {
        this.query.filters[this.selectedTagIndex].filter.push(v);

        const index = this.filteredTagValues.indexOf(v);
        if ( index !== -1 ) {
            this.filteredTagValues.splice(index, 1);
        }
        console.log("add tag value", v, this.query.filters);
    }

    removeTagValue(v) {
        const vIndex = this.query.filters[this.selectedTagIndex].filter.indexOf(v);
        this.query.filters[this.selectedTagIndex].filter.splice(vIndex, 1);
        console.log("remove tag value", v, this.query.filters);

    }

    isInfilteredKeys(key) {
        const keys = [];
        for ( let i = 0, len = this.query.filters.length; i < len; i++  ) {
            keys.push(this.query.filters[i].tagk );
        }
        return keys.indexOf(key);
    }

    // handle when clicked on cancel
    cancel(): void {
        this.dialogRef.close();
    }

    // handle when clicked on apply
    apply(): any {
        // NOTE: Not sure emit is needed. Might be ok to just pass data from the close action.
        // this.onDialogApply.emit({
        //    action: 'applyDialog',
        //    data: this.dialog_data
        // });
        this.dialogRef.close({ query: this.query });
    }

    /*
    ngOnChanges( changes: SimpleChanges ) {
        if ( changes.query && changes.query.currentValue ) {
            const query = changes.query.currentValue;
            for ( let i = 0; i < query.filters.length; i++ ) {
                const tag = query.filters[i].tagk;
                this.tags[tag] = query.filters[i].filter;
            }
        }

        if ( changes.showTag && changes.showTag.currentValue) {
            console.log("showTag",  this.showTag);
            this.showTagControl = changes.showTag.currentValue;
        }
    }


    setTag( tag ) {

        this.tags[tag] = [];
        //if ( tag === 'metric' ) {
        //    this.query.metric = '';
        //} else {
            const filter = {
                            type: 'literalor',
                            tagk: tag,
                            filter: '',
                            groupBy: false
                        };
            this.query.filters.push(filter);
        // }

        // new reference needs to be passed to the tag auto complete control
        this.tags = { ...this.tags };
        this.query = { ...this.query };
        this.currentTag = tag;
        //this.setEditTagValue(tag , '');
        this.showTagValueControl = true;
        this.showTagControl = false;
    }

    setTagValue(  v , tag ) {
        console.log("settagvalue, tag=", tag, "v=", v, JSON.stringify(this.query));
        if ( ! this.tags[tag] ) {
            this.tags[tag] = [];
        }

        // we support single value now
        this.tags[tag] = v ;

        if ( tag === 'metric') {
            this.query.metric = v[0];
        }
        const index = this.query.filters.findIndex( item => item.tagk === tag );
        this.query.filters[index].filter = v;

        // new reference needs to be passed to the tag auto complete control
        this.tags = { ...this.tags };
        this.query = { ...this.query };

        this.showTagControl = false;
        this.showTagValueControl = false;

        if ( this.editTagValue === '' ) {
            // 
        } else {
            this.editTagValue = '';
        }
        this.queryOutput.emit(this.query);
        console.log("settagvalue", tag, v, JSON.stringify(this.query));
    }

    showAddTagButton() {
        this.showTagControl = false;
        this.showAddTagBtn = true;
    }

    setTagDefaultValue() {
        this.setTagValue('*', this.currentTag);
        this.showAddTagButton();
    }

    setEditTagValue( tag , value ) {

        this.editTagValue = tag;
        console.log( " setEditTagValue", this.editTagValue);
    }

    activateTagAutoSuggest() {
        this.showTagControl = true;
    }
    */
}
