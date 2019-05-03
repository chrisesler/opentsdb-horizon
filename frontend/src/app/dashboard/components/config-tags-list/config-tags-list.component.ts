import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, OnInit, ViewChild, Input, Output, HostBinding } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatChipInputEvent } from '@angular/material';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
    selector: 'app-config-tags-list',
    templateUrl: './config-tags-list.component.html',
    styleUrls: []
})
export class ConfigTagsListComponent implements OnInit {
    @HostBinding('class.config-tags-list') private _hostClass = true;

    @Input() tags: Array<object>;
    @ViewChild('tagInput') tagInput: ElementRef;

    visible = true;
    selectable = true;
    removable = true;
    addOnBlur = false;
    separatorKeysCodes = [ENTER, COMMA];

    // for form and autocomplete
    tagCtrl = new FormControl();
    filteredTags: Observable<any[]>;

    // this needs to be gotten from a service somehow
    allTags = [
        {
            key: 'colo',
            value: 'bf1'
        },
        {
            key: 'colo',
            value: 'gq1'
        },
    ];

    constructor() {
        this.filteredTags = this.tagCtrl.valueChanges.pipe(
            startWith(null),
            map((tag: any | null) => tag ? this.filter(tag) : this.allTags.slice()));
    }

    ngOnInit() {
    }

    add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value.trim();

        // console.log('CONFIG TAG ADD', input, value);

        // Add our tag
        if (value && value.indexOf(':')) {
            const val = value.split(':');
            this.tags.push({ key: val[0].trim(), value: val[1].trim() });

            // Reset the input value
            if (input) {
                input.value = '';
            }
        }

    }

    remove(tag: any): void {
        // console.log('CONFIG TAG REMOVE', tag);
        const index = this.tags.indexOf(tag);

        if (index >= 0) {
            this.tags.splice(index, 1);
        }
    }

    filter(name: string) {
        // console.log('CONFIG TAG FILTER', name);
        if (name.indexOf(':') > -1) {
            name = name.split(':')[0];
        }
        return this.allTags.filter(tag =>
            tag.key.toLowerCase().indexOf(name.toLowerCase()) === 0);
    }

    selected(event: MatAutocompleteSelectedEvent): void {
        // console.log('CONFIG TAG SELECTED', event);
        this.tags.push(event.option.value);
        this.tagInput.nativeElement.value = '';
    }

}
