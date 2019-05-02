import { Component, OnInit, OnChanges, HostBinding, HostListener, Input, Output, EventEmitter, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteTrigger, MatChipInputEvent, MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material';
import {COMMA, TAB, ENTER} from '@angular/cdk/keycodes';



import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap, filter } from 'rxjs/operators';

import { HttpService } from '../../../../../core/http/http.service';
@Component({
  selector: 'app-namespace-tag-values',
  templateUrl: './namespace-tag-values.component.html',
  styleUrls: ['./namespace-tag-values.component.scss']
})
export class NamespaceTagValuesComponent implements OnInit, OnChanges {

    @HostBinding('class.namespace-tag-autocomplete') private _hostClass = true;
    @ViewChild('tagInput') tagInput: ElementRef;
    @ViewChild(MatAutocompleteTrigger) trigger;
    @ViewChild('tagAuto') matAutocomplete: MatAutocomplete;


    @Input() value = [];
    @Input() namespace;
    @Input() tagkey;
    @Input() tagsSelected: any = {};
    @Output() tagValueChange = new EventEmitter();
    @Output() blur = new EventEmitter();
    separatorKeysCodes: number[] = [ENTER, COMMA];
    filteredTagOptions: Observable<string[]>;
    tagControl: FormControl;
    chipControl: FormControl;
    tags = [];
    tagValues = [];

    constructor( private httpService: HttpService, private elRef: ElementRef ) { }

    ngOnInit() {
        this.tagControl = new FormControl('');
        this.chipControl = new FormControl();
        this.tagValues = this.value || [];

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
            this.trigger.openPanel();
        });
    }

    ngOnChanges( changes: SimpleChanges) {
        if ( changes.namespace && changes.namespace.currentValue ) {
            // this.tagInput.nativeElement.focus();
        }

        if ( changes.value  && this.tagControl ) {
            this.tagValues = changes.value.currentValue;
            this.tagControl.setValue(null);
            // console.log("on change tagValues=", this.tagValues);
        }
        if ( changes.tagsSelected  && this.tagControl ) {
            // console.log(" tag value on changes" , changes.tagsSelected);
        }
    }

    add(event: MatChipInputEvent): void {
        // Add fruit only when MatAutocomplete is not open
        // To make sure this does not conflict with OptionSelected Event
        if (!this.matAutocomplete.isOpen) {
          const input = event.input;
          const value = event.value;

          // Add our fruit
          if ((value || '').trim()) {
            this.tagValues.push(value.trim());
          }

          // Reset the input value
          if (input) {
            input.value = '';
          }

          // console.log("tagvalues=>", this.tagValues);
          this.tagControl.setValue(null);
        }
    }

    removeItem(v: string): void {
        const index = this.tagValues.indexOf(v);
        if (index >= 0) {
          this.tagValues.splice(index, 1);
        }
        // console.log("revmoe item", this.tagValues);
        this.trigger.closePanel();
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
        this.tagValues.push(event.option.viewValue);
        this.tagInput.nativeElement.value = '';
        this.tagControl.setValue(null);
    }

    @HostListener('click', ['$event'])
    hostClickHandler(e) {
        e.stopPropagation();
    }

    @HostListener('document:click', ['$event.target'])
    documentClickHandler(target) {
        if ( ! target.classList.contains('mat-option-text')) {
            // console.log('window:click outside', this.elRef, target);
            this.sendTagValues();
        }
    }

    @HostListener('document:keydown', ['$event'])
    keydown(e: KeyboardEvent) {
      if ( e.keyCode === TAB ) {
        // console.log('keydown: tab', e);
        this.sendTagValues();
      }
    }

    sendTagValues() {
        this.trigger.closePanel();
        this.tagValueChange.emit(this.tagValues);
    }
}
