import { Component, OnInit, HostBinding, Input, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material';


import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, switchMap, filter, catchError } from 'rxjs/operators';

import { HttpService } from '../../../../../core/http/http.service';


@Component({
  selector: 'namespace-tag-autocomplete',
  templateUrl: './namespace-tag-autocomplete.component.html',
  styleUrls: ['./namespace-tag-autocomplete.component.scss']
})
export class NamespaceTagAutocompleteComponent implements OnInit {
    @HostBinding('class.namespace-tag-autocomplete') private _hostClass = true;
    @ViewChild('tagInput') tagInput: ElementRef;
    @ViewChild(MatAutocompleteTrigger) trigger;


    @Input() value = '';
    @Input() namespace;
    @Input() tagsSelected: any = {};
    @Output() tagchange = new EventEmitter();
    @Output() blur = new EventEmitter();
    filteredTagOptions: Observable<any>;
    tagControl: FormControl;
    tags = [];

    constructor( private httpService: HttpService ) { }

    ngOnInit() {
        this.tagControl = new FormControl();
        // need to include switchMap to cancel the previous call
        this.tagControl.valueChanges
            .pipe(
                startWith(''),
                debounceTime(200)
            )
            .subscribe(value => {
                const query: any = { namespace: this.namespace, tags: [] };

                for (const k in this.tagsSelected) {
                    if (k !== 'metric' && this.tagsSelected[k].length) {
                        query.tags.push({ key: k, value: this.tagsSelected[k] });
                    }
                }

                query.search = value;

                // filter tags by metrics
                if (this.tagsSelected && this.tagsSelected.metric) {
                    // console.log("tagsSelected", this.tagsSelected, Array.isArray(this.tagsSelected.metric));
                    query.metrics = Array.isArray(this.tagsSelected.metric) ? this.tagsSelected.metric : [this.tagsSelected.metric];
                }
                // console.log("tag query", query);
                this.httpService.getNamespaceTagKeys(query)
                    .pipe(
                        // debounceTime(200),
                        catchError(val => of(`I caught: ${val}`)),
                    ).subscribe(res => {
                        // console.log("comsd ", res);
                        const tagkeysSelected = Object.keys(this.tagsSelected);
                        res = res.filter(tag => tagkeysSelected.indexOf(tag) === -1);
                        this.filteredTagOptions = of(res);
                    });
                this.tagInput.nativeElement.focus();
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
