import { Component, OnInit, OnChanges, AfterViewChecked, HostBinding, Input, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material';


import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap, filter } from 'rxjs/operators';

import { HttpService } from '../../../../../core/http/http.service';
@Component({
  selector: 'app-namespace-tag-values',
  templateUrl: './namespace-tag-values.component.html',
  styleUrls: ['./namespace-tag-values.component.scss']
})
export class NamespaceTagValuesComponent implements OnInit, OnChanges, AfterViewChecked {

    @HostBinding('class.namespace-tag-autocomplete') private _hostClass = true;
    @ViewChild('tagInput') tagInput: ElementRef;
    @ViewChild(MatAutocompleteTrigger) trigger;


    @Input() value = '';
    @Input() namespace;
    @Input() tagkey;
    @Input() tagsSelected: any = {};
    @Output() tagValueChange = new EventEmitter();
    @Output() blur = new EventEmitter();
    filteredTagOptions: Observable<string[]>;
    tagControl: FormControl;
    tags = [];

    constructor( private httpService: HttpService ) { }

    ngOnInit() {
        this.tagControl = new FormControl(this.value);

        // need to include switchMap to cancel the previous call
        this.tagControl.valueChanges
        .pipe(
            startWith(''),
            debounceTime(200)
        )
        .subscribe( value => {
            const query: any = { namespace: this.namespace, tags: [] };

            for ( const k in this.tagsSelected ) {
                if ( k !== 'metric' && k !== this.tagkey && this.tagsSelected[k].length ) {
                    query.tags.push({key: k,  value: this.tagsSelected[k]});
                }
            }

            query.search = value;
            // console.log(JSON.stringify(query.tags), "tagvalues", JSON.stringify(this.tagsSelected));
            if ( this.tagkey === 'metric' ) {
                this.filteredTagOptions = this.httpService.getMetricsByNamespace(query);
            } else {
                query.tagkey = this.tagkey;
                // filter tags by metrics
                if ( this.tagsSelected && this.tagsSelected.metric ) {
                    query.metrics = Array.isArray(this.tagsSelected.metric) ? this.tagsSelected.metric : [ this.tagsSelected.metric ];
                }
                this.filteredTagOptions = this.httpService.getTagValuesByNamespace(query);
            }
            this.tagInput.nativeElement.focus();
        });
    }

    ngOnChanges( changes: SimpleChanges) {
        if ( changes.namespace && changes.namespace.currentValue ) {
            // this.tagInput.nativeElement.focus();
        }

        if ( changes.value  && this.tagControl ) {
            this.tagControl.setValue(this.value);
        }
        if ( changes.tagsSelected  && this.tagControl ) {
            console.log(" tag value on changes" , changes.tagsSelected);
        }
    }

    ngAfterViewChecked() {

        // this.showAutosuggest();
    }

    showAutosuggest() {
        this.trigger._onChange('');
        this.trigger.openPanel();
    }


    tagKeydown(event: any) {
        this.tagValueChange.emit( this.tagControl.value );
    }

    /**
     * * Event fired when an autocomplete option is selected
     */
    tagSelected(event: any) {
        this.tagValueChange.emit( event.option.value );
    }

    handleBlur(e) {
        setTimeout(() => {
            this.blur.emit();
        }, 3000);
    }

}
