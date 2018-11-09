import { Component, OnInit, OnChanges, HostBinding, Input, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material';


import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap, filter } from 'rxjs/operators';

import { HttpService } from '../../../../../core/http/http.service';
import { namespace } from 'd3';


@Component({
  selector: 'namespace-tag-autocomplete',
  templateUrl: './namespace-tag-autocomplete.component.html',
  styleUrls: ['./namespace-tag-autocomplete.component.scss']
})
export class NamespaceTagAutocompleteComponent implements OnInit, OnChanges {
    @HostBinding('class.namespace-tag-autocomplete') private _hostClass = true;
    @ViewChild('tagInput') tagInput: ElementRef;
    @ViewChild(MatAutocompleteTrigger) trigger;


    @Input() value = '';
    @Input() namespace;
    @Input() tagsSelected: any = {};
    @Output() tagchange = new EventEmitter();
    @Output() blur = new EventEmitter();
    filteredTagOptions: Observable<string[]>;
    tagControl: FormControl;
    tags = [];

    constructor( private httpService: HttpService ) { }

    ngOnInit() {
        this.tagControl = new FormControl(this.value);
    }

    ngOnChanges( changes: SimpleChanges) {
        if ( changes.namespace && changes.namespace.currentValue ) {
            this.setNamespaceTags();
        }

        if ( changes.tagsSelected  && this.tagControl ) {
            console.log(" tag value on changes" , changes.tagsSelected);
            // this.tagControl.setValue(this.tagvalue);
            this.tagInput.nativeElement.focus();
            this.showAutosuggest();
        }
    }

    showAutosuggest() {
        this.trigger._onChange('');
        this.trigger.openPanel();
    }

    setNamespaceTags() {
        const query: any = { namespace: this.namespace };
        // filter tags by metrics
        if ( this.tagsSelected && this.tagsSelected.metric ) {
            query.metrics = Array.isArray(this.tagsSelected.metric) ? this.tagsSelected.metric : [ this.tagsSelected.metric ];
        }

        this.httpService.getNamespaceTagKeys(query).subscribe(tags => {
            if ( tags && tags.length ) {
                this.tags = tags;
            }
            this.tags.unshift('metric');

            const tagsSelected = Object.keys(this.tagsSelected);
            this.tags = this.tags.filter( tag => tagsSelected.indexOf(tag) === -1 );
            console.log("___setTags___", tags);
            this.filteredTagOptions = this.tagControl.valueChanges
                                                        .pipe(
                                                            startWith(''),
                                                            map(term => this.tags.filter( d => !term || d.toLowerCase().includes(term) )  )
                                                        );
            this.tagInput.nativeElement.focus();
            this.showAutosuggest();
        });

    }


    tagKeydown(event: any) {
        this.tagchange.emit( this.tagControl.value );
    }

    /**
     * * Event fired when an autocomplete option is selected
     */
    tagSelected(event: any) {
        this.tagchange.emit( event.option.value );
    }

    handleBlur(e) {
        setTimeout(() => {
            this.blur.emit(e);
        }, 3000);
    }
}
