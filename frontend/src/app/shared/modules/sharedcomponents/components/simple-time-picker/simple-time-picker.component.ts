import { Component, OnInit, ViewChild, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

import { MatMenu, MatMenuTrigger } from '@angular/material';

// NOTE: This was taken directly from Material2 date-picker docs
// NOTE: This is SUPER simplified for demo only
// Depending on whether rollup is used, moment needs to be imported differently.
// Since Moment.js doesn't have a default export, we normally need to import using the `* as`
// syntax. However, rollup creates a synthetic default module and we thus need to import it using
// the `default as` syntax.
import * as _moment from 'moment';
// tslint:disable-next-line:no-duplicate-imports
// import { default as _rollupMoment } from 'moment';

// const moment = _rollupMoment || _moment;
const moment = _moment;

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'simple-time-picker',
    templateUrl: './simple-time-picker.component.html',
    styleUrls: [],
    providers: [
        // `MomentDateAdapter` and `MAT_MOMENT_DATE_FORMATS` can be automatically provided by importing
        // `MatMomentDateModule` in your applications root module. We provide it at the component level
        // here, due to limitations of our example generation script.
        { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    ]
})
export class SimpleTimePickerComponent implements OnInit {
    @HostBinding('class.nav-simple-time-picker') private _hostClass = true;

    @Input() startTime: any | null;
    @Input() endTime: any | null;

    @Output() startTimeChange = new EventEmitter<any>();
    @Output() endTimeChange = new EventEmitter<any>();

    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    // form controls
    startTimeControl = new FormControl();
    endTimeControl = new FormControl();

    // values of presets
    presetOptions: Array<object> = [
        {
            group: 'Hours',
            options: [
                '1h',
                '6h',
                '12h',
                '24h'
            ]
        },
        {
            group: 'Days',
            options: [
                '2d',
                '4d',
                '7d',
            ]
        },
        {
            group: 'Months',
            options: [
                '1mo',
                '3mo',
                '1yr'
            ]
        }
    ];

    constructor() { }

    ngOnInit() {
        if (!this.startTime) {
            this.startTime = moment().subtract(1, 'days').valueOf();
        }

        if (!this.endTime) {
            this.endTime = moment().valueOf();
        }

        this.startTimeControl.setValue(this.startTime);
        this.endTimeControl.setValue(this.endTime);

    }

    /**
     * * Preset click event
     * @param preset value of preset (i.e. 1hr, 2hr, 3d, etc)
     * @param event actual event object
     */
    presetClick_Event(preset: any, event: any) {
        console.log('PRESET CLICK EVENT', preset, event);
    }

    /**
     * * DATE INPUT CHANGE EVENT
     * @param prop model key (i.e. startTime)
     * @param type input change, or date change
     * @param event actual event object
     */
    dateInput_Event(prop: any, type: any, event: any) {
        console.log('DATE INPUT CHANGE', prop, type, event);
    }

}
