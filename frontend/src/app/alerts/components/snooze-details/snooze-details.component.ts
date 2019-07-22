
import {
    Component,
    OnInit, OnChanges, Input, Output, EventEmitter,
    SimpleChanges,
    OnDestroy,
    Inject,
    HostBinding,
    ViewChild, ElementRef, HostListener, Injectable
} from '@angular/core';

import { MatChipInputEvent, MatMenuTrigger, MatInput } from '@angular/material';
import {COMMA, ENTER} from '@angular/cdk/keycodes';


import { FormBuilder, FormGroup, FormControl, FormGroupDirective } from '@angular/forms';

import { Subscription, Observable } from 'rxjs';
import { UtilsService } from '../../../core/services/utils.service';
import { MetaService } from '../../../core/services/meta.service';



import { MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { IntercomService } from '../../../core/services/intercom.service';


import * as moment from 'moment';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'snooze-details',
    templateUrl: './snooze-details.component.html',
    styleUrls: [],
    providers: [
        { provide: DateAdapter, useClass:  MomentDateAdapter},
        { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    ]
})
export class SnoozeDetailsComponent implements OnInit, OnChanges {

    @HostBinding('class.snooze-alert-dialog-component') private _hostclass = true;

    @ViewChild('formDirective', {read: FormGroupDirective}) formDirective: FormGroupDirective;
    @ViewChild('alertListMenu', { read: MatMenuTrigger }) private alertListMenuTrigger: MatMenuTrigger;
    @ViewChild('alertInput', { read: MatInput }) private alertInput: MatInput;


    @Input() viewMode: string = ''; // edit || view

    @Input() hasWriteAccess: boolean = false;
    @Input() alertListMeta = [];

    get readOnly(): boolean {
        if (!this.hasWriteAccess) { return true; }
        return (this.viewMode === 'edit') ? false : true;
    }

    @Output() configChange = new EventEmitter();

    // placeholder for expected data from dialogue initiation
    @Input() data: any = {
        namespace: ''
    };

    /** Form  */
    snoozeForm: FormGroup;
    startTimeCntrl: FormControl;
    endTimeCntrl: FormControl;
    dateType = 'preset';
    timePreset = '1hr';

    presetOptions: any[] = [ {label: '1hr', value: 1, unit: 'hours'},
                             {label: '6hr', value: 6, unit: 'hours'},
                             {label: '12hr', value: 12, unit: 'hours'},
                             {label: '1d', value: 1, unit: 'days'},
                             {label: '2d', value: 2, unit: 'days'},
                             {label: '1w', value: 1, unit: 'weeks'}
                            ];

    presetChangeSub: Subscription;
    timeOptions: any[] = [];

    readonly separatorKeysCodes: number[] = [ENTER, COMMA];

    queries: any[] = [];
    alertLabels: any[] = [];
    // alertLabels: any[] = [ {label: 'lable1', type: 'label'}, {label: 'label2', type: 'label'}];
    // allAlertLabelsOptions: any[] = [ {label: 'lable1', type: 'label'}, {label: 'label2', type: 'label'}, {label: 'label3', type: 'label'}];

    constructor(
        private elRef: ElementRef,
        private fb: FormBuilder,
        private utils: UtilsService,
        private interCom: IntercomService,
        private metaService: MetaService
    ) { }

    ngOnInit() {
        for ( let i = 0; i < 24; i++ ) {
            for ( let j = 0; j < 60; j = j + 15 ) {
                this.timeOptions.push( {
                                            label: i.toString().padStart(2, '0') + ':' + j.toString().padStart(2, '0'),
                                            value: (i * 60 * 60 + j * 60) * 1000 } );
            }
        }
        this.setupForm(this.data);
    }

    ngOnChanges( changes: SimpleChanges ) {
        if (changes.alertListMeta && changes.alertListMeta.currentValue) {
            const alertListMeta = changes.alertListMeta.currentValue;
            for ( let i = 0; i < this.data.alertIds.length; i++ ) {
                const option = alertListMeta.find(d => d.id === this.data.alertIds[i]); 
                if ( option ) {
                    this.alertLabels.push(option);
                }
            }
        }
    }

    setupForm(data) {
        const def = {
            notification: {}
        };
        data = Object.assign({}, def, data);

        const starthrms = data.startTime ? (data.startTime + moment(data.startTime).utcOffset() * 60 * 1000) % 86400000 : 0;
        const endhrms = data.endTime ? (data.endTime + moment(data.endTime).utcOffset() * 60 * 1000) % 86400000 : 0;
        console.log("data=>", this.utils.deepClone(data), data.startTime, starthrms);

        this.snoozeForm = this.fb.group({
            startTime: data.startTime ? new Date(data.startTime - starthrms) : new Date(),
            endTime: data.endTime ? new Date(data.endTime - endhrms) : new Date(),
            notification: this.fb.group({
                recipients: data.notification.recipients || {'email': [ {name: 'syed'}]},
                subject: data.notification.subject || 'test',
                message: data.notification.message || 'subject'
            })
        });
        // add alerts to selection list
        // add labels to selection list
        for ( let i = 0; i < data.labels.length; i++ ) {
            this.alertLabels.push({ label: data.labels[i], type: 'label'});
        }
        this.startTimeCntrl = new FormControl(starthrms);
        this.endTimeCntrl = new FormControl(endhrms);

        this.dateType = data.id ? 'custom' : 'preset';

    /*
        const filters2 = [
            {
              "type": "FieldLiteralOr",
              "key": "statusType",
              "filter": "check"
            },
            {
              "type": "Chain",
              "op": "OR",
              "filters": [
                {
                  "type": "TagValueRegex",
                  "filter": ".*",
                  "tagKey": "Region"
                },
                {
                  "type": "TagValueLiteralOr",
                  "filter": "ap-northeast-2|ap-south-1",
                  "tagKey": "Region"
                }
              ]
            },
            {
              "type": "Chain",
              "op": "OR",
              "filters": [
                {
                  "type": "TagValueLiteralOr",
                  "filter": "supervisor-l-10.yms.bf2.yahoo.com|supervisor-l-11.yms.gq1.yahoo.com|supervisor-l-12.yms.bf2.yahoo.com",
                  "tagKey": "host"
                }
              ]
            },
            {
              "type": "TagValueLiteralOr",
              "filter": "003255642081",
              "tagKey": "AwsId"
            }
          ];
        */
        const filters = data.filters && data.filters.filters.length ? this.getFiltersTsdbToLocal(data.filters.filters) : [];
        this.setQuery({ namespace: this.data.namespace, filters: filters} );
    }

    getFiltersTsdbToLocal(filters) {
        const filterTypes = ['TagValueLiteralOr', 'TagValueRegex'];
        let newFilters = [];
        for (let i = 0; i < filters.length; i++ ) {
            const filter = filters[i];
            const ftype = filter.type;
            if ( ftype === 'Chain' && filter['op'] === 'OR' ) {
                newFilters = newFilters.concat(this.getFiltersTsdbToLocal(filter.filters));
            } else if ( filterTypes.includes(ftype) ) {
                let values = [];
                switch ( ftype ) {
                    case 'TagValueLiteralOr':
                        values = filter.filter.split('|');
                        break;
                    case 'TagValueRegex':
                        values = ['regexp(' + filter.filter + ')'];
                        break;
                }
                const index = newFilters.findIndex(d => d.tagk === filter.tagKey);
                if ( index === -1 ) {
                    newFilters.push( { tagk: filter.tagKey, filter: values });
                } else {
                    newFilters[index].filter = newFilters[index].filter.concat(values);
                }
            }
        }
        return newFilters;
    }

    setQuery(query) {
        this.queries =  [ this.getQueryConfig(query) ];
    }

    getQueryConfig(query) {
        const def: any = {
            id: this.utils.generateId(6, this.utils.getIDs(this.queries)),
            namespace: '',
            metrics: [],
            filters: [],
            settings: {
                visual: {
                    visible: true
                }
            }
        };
        query = Object.assign({}, def, query);
        return query;
    }

    showAlertPanel() {
            this.alertListMenuTrigger.toggleMenu();
    }

    addAlertOrLabel(item) {
        this.alertLabels.push(item);
    }

    removeAlertOrLabel(index) {
        this.alertLabels.splice(index, 1);
    }

    alertRecipientsUpdate(event: any) {
        this.snoozeForm.get('notification').get('recipients').setValue(event);
    }

    /*
    get form() {
        return this.snoozeForm.controls;
    }

    get custom() {
        return this.form.custom['controls'];
    }
    */

    getMetaFilter() {
        const query: any = { search: '', namespace: this.queries[0].namespace, tags: this.queries[0].filters, metrics: [] };
        const metaQuery = this.metaService.getQuery('aurastatus', 'TAG_KEYS', query);
        return metaQuery.queries[0].filter;
    }

    validate() {
        this.snoozeForm.markAsTouched();
        this.snoozeForm.get('startTime').setErrors(null);
        this.snoozeForm.get('endTime').setErrors(null);

        if ( this.dateType === 'custom' ) {
            if ( this.snoozeForm.get('startTime').value === null ) {
                this.snoozeForm.get('startTime').setErrors({ 'required': true });
            }
            const endtime = this.snoozeForm.get('endTime').value;
            if (  endtime === null ) {
                this.snoozeForm.get('endTime').setErrors({ 'required': true });
            } else if ( endtime.valueOf() + this.endTimeCntrl.value <= moment().valueOf() ) {
                this.snoozeForm.get('endTime').setErrors({ 'future': true });
            }
            console.log("data endtime", endtime.valueOf(), this.endTimeCntrl.value, endtime.valueOf()+ this.endTimeCntrl.value , moment().valueOf())
        }

        if ( Object.keys(this.snoozeForm.get('notification').get('recipients').value).length === 0 ) {
            this.snoozeForm.get('notification').get('recipients').setErrors({ 'required': true });
        }
        if ( this.snoozeForm.get('notification').get('subject').value.trim() === '' ) {
            this.snoozeForm.get('notification').get('subject').setErrors({ 'required': true });
        }

        if ( this.snoozeForm.get('notification').get('message').value.trim() === '' ) {
            this.snoozeForm.get('notification').get('message').setErrors({ 'required': true });
        }

        if ( this.snoozeForm.valid ) {
            // clear system message bar
            this.interCom.requestSend({
                action: 'clearSystemMessage',
                payload: {}
            });
           this.saveSnooze();

        } else {
            // set system message bar
            this.interCom.requestSend({
                action: 'systemMessage',
                payload: {
                    type: 'error',
                    message: 'Your form has errors. Please review your form, and try again.'
                }
            });
        }

    }

    saveSnooze() {
        const data: any = this.utils.deepClone(this.snoozeForm.getRawValue());
        data.id = this.data.id;
        data.alertIds = this.alertLabels.filter(d => d.type === 'alert').map(d => d.id);
        data.labels = this.alertLabels.filter(d => d.type === 'label').map(d => d.label);
        if ( this.dateType === 'preset' ) {
            const tconfig = this.presetOptions.find( d => d.label === this.timePreset );
            const m = moment();
            data.startTime = m.valueOf();
            data.endTime = m.add(tconfig.value, tconfig.unit).valueOf();
        } else {
            data.startTime = this.snoozeForm.get('startTime').value.valueOf() + this.startTimeCntrl.value;
            data.endTime = this.snoozeForm.get('endTime').value.valueOf() + this.endTimeCntrl.value;
        }
        data.filters = this.getMetaFilter();
        console.log("save snooze", JSON.parse(JSON.stringify(data)));
        // emit to save the snooze
        this.configChange.emit({ action: 'SaveSnooze', namespace: this.data.namespace, payload: { data: this.utils.deepClone([data]) }} );
    }

    cancelEdit() {
        this.configChange.emit({
            action: 'CancelSnoozeEdit'
        });
    }

    @HostListener('document:click', ['$event'])
    clickOutsideComponent(event) {
        if ( this.alertListMenuTrigger.menuOpened && !event.target.classList.contains('mat-chip-input')) {
            this.alertListMenuTrigger.closeMenu();
        }
    }

}
