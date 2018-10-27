import {
    Component,
    OnInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    ViewChild,
    ElementRef
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatChipInputEvent, MatAutocomplete } from '@angular/material';

import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'variable-selector',
    templateUrl: './variable-selector.component.html',
    styleUrls: []
})
export class VariableSelectorComponent implements OnInit, OnDestroy {

    // tslint:disable-next-line:no-inferrable-types
    @HostBinding('class.variable-selector') private _hostClass: boolean = true;

    @Input() itemGroup: FormGroup;

    @Output() itemDataChanged: any = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    ngOnDestroy() {
    }

}
