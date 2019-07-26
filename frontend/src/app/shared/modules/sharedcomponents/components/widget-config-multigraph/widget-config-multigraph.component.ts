import { Component, OnInit, OnDestroy, AfterViewInit, HostBinding, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';

import {CdkDragDrop, moveItemInArray, transferArrayItem, CdkDragHandle, CdkDropList, CdkDrag} from '@angular/cdk/drag-drop';

import {MatTable} from '@angular/material/table';
import { HttpService } from '../../../../../core/http/http.service';
import { UtilsService } from '../../../../../core/services/utils.service';
import { MatAutocompleteTrigger } from '@angular/material';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'widget-config-multigraph',
    templateUrl: './widget-config-multigraph.component.html',
    styleUrls: []
})
export class WidgetConfigMultigraphComponent implements OnInit, OnDestroy {

    @ViewChild('chartTable') chartTable: MatTable<any>;
    @ViewChild('tagKeyInput', {read: ElementRef}) tagKeyInput: ElementRef;
    @ViewChild('tagKeyInput', {read: MatAutocompleteTrigger}) tagKeyACTrigger: MatAutocompleteTrigger;

    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.multigraph-configuration') private _tabClass = true;

    /** Inputs */
    private _widget: any = {};
    @Input()
    set widget(val: any) {
        this._widget = val;
        // get tag keys?
        this.getWidgetTagKeys();
    }

    get widget(): any {
        return this._widget;
    }

    /** Outputs */
    @Output() widgetChange = new EventEmitter();

    /** Subscriptions */
    private subscription: Subscription = new Subscription();

    /** local variables */
    widgetTags = { rawWidgetTags: {}, totalQueries: 0, tags: [] };
    isWidgetTagsLoaded = false;
    isWidgetTagsLoaded$ = new Subject();

    tagKeyControlInput = new FormControl('');

    /** Form Group */
    widgetConfigMultigraph: FormGroup;

    // form subscriptions

    // form values

    // form control options
    layoutPresetOptions: Array<any> = [
        {
            label: 'Grid',
            value: 'grid'
        },
        {
            label: 'Freeflow',
            value: 'freeflow'
        }
    ];

    // custom row/colum count select value options
    customPresetValues: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    availableTagOptions: Array<any> = [];

    /** Mat Table Stuff */
    chartDisplayColumns: string[] = ['label', 'x', 'y', 'g', 'order'];


    /** FAKE DATA */

    fakeMultigraph: any = {
        chart: [
            {
                key: 'metric_group',
                displayAs: 'g', // x|| y || g
                order: 0
            },
            {
                key: 'tag_label',
                displayAs: 'g', // x|| y || g
                order: 1
            }
        ],
        layout: 'grid', // grid || freeflow
        gridOptions: {
            viewportDisplay: 'fit', // fit || custom
            custom: {
                x: 3,
                y: 3
            }
        }
    };


    constructor(
        private fb: FormBuilder,
        private httpService: HttpService,
        private utilService: UtilsService
    ) { }

    ngOnInit() {
        this.createForm();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    createForm() {

        // setup the group
        this.widgetConfigMultigraph = this.fb.group({
            chart: this.fb.array([]),
            layout: new FormControl('', [Validators.required]),
            gridOptions: this.fb.group({
                viewportDisplay: new FormControl('', [Validators.required]),
                custom: this.fb.group({
                    x: new FormControl(1),
                    y: new FormControl(1, [Validators.required])
                })
            })
        });

        // patch with values (triggering first valueChange)
        this.widgetConfigMultigraph.patchValue(this.fakeMultigraph, {
            emitEvent: true
        });

        for (const i in this.fakeMultigraph.chart) {
            if (this.fakeMultigraph.chart[i]) {
                const chartItem = this.fakeMultigraph.chart[i];
                this.addChartItem(chartItem);
            }
        }

        this.setViewportDisplayValidators();

        console.log('FORM', this.widgetConfigMultigraph);
    }

    setViewportDisplayValidators() {
        this.subscription.add(
            this.FC_gridOpts_viewportDisplay.valueChanges.subscribe(viewportDisplay => {
                console.log ('VIEWPORT DISPLAY [CHANGE]', viewportDisplay);
                if (viewportDisplay === 'custom') {
                    this.FC_gridOpts_custom_x.setValidators([Validators.required]);
                    this.FC_gridOpts_custom_x.enable();
                    // this.FC_gridOpts_custom_y.setValidators([Validators.required]);
                    // this.FC_gridOpts_custom_y.enable();
                } else {
                    this.FC_gridOpts_custom_x.setValidators(null);
                    this.FC_gridOpts_custom_x.disable();
                    // this.FC_gridOpts_custom_y.setValidators(null);
                    // this.FC_gridOpts_custom_y.disable();
                }
            })
        );

        this.subscription.add(
            this.widgetConfigMultigraph.controls['chart'].valueChanges.subscribe(changes => {
                console.log('CHART CHANGES', changes);
                if (this.chartTable) {
                    this.chartTable.renderRows();
                }
            })
        );
    }

    addChartItem(data: any) {
        const chartItem = this.fb.group(data);
        const control = <FormArray>this.FC_chart;
        control.push(chartItem);
    }

    addTagKeyChartItem(key: string) {
        const control = <FormArray>this.FC_chart;
        const chartItem = {key, displayAs: 'g', order: (control['controls'].length - 1)};
        this.addChartItem(chartItem);
    }

    dropTable(event: any) {
        // console.log('DROP TABLE EVENT', event);
        const prevIndex = this.FC_chart['controls'].findIndex((d) => d === event.item.data);
        moveItemInArray(this.FC_chart['controls'], prevIndex, event.currentIndex);
        this.setChartDataOrder();
        // this.chartTable.renderRows();
    }

    setChartDataOrder() {
        const controls = this.FC_chart['controls'];
        for (let i; i < controls.length; i++) {
            const formGroup = <FormGroup>controls[i];
            formGroup.get('order').setValue(i);
        }
        this.FC_chart.updateValueAndValidity({onlySelf: false, emitEvent: true});
    }

    /** auto complete stuff */

    onTagKeyInputBlur(event: any) {
        console.log('TAG KEY INPUT BLUR', event);
        // check if in tag key array
        const val = this.tagKeyControlInput.value;

        const idx = this.widgetTags.tags.findIndex(item => item && item.toLowerCase() === val.toLowerCase());

        if (idx === -1) {
            this.tagKeyControlInput.setValue('');
        } else {
            this.addTagKeyChartItem(this.widgetTags.tags[idx]);
            this.tagKeyControlInput.setValue('');
        }

    }

    onTagKeyInputFocus() {
        console.log('TAG KEY INPUT FOCUS');
        this.tagKeyControlInput.setValue('');
        this.tagKeyACTrigger.openPanel();
    }

    tagKeyOptionSelected(event: any) {
        // console.log('TAG KEY OPTION SELECTED', event);
        this.addTagKeyChartItem(event.option.value);
        this.tagKeyControlInput.setValue('');
        this.tagKeyInput.nativeElement.focus();
    }

    /** network stuff */

    getWidgetTagKeys() {
        this.httpService.getTagKeysForQueries([this.widget]).subscribe((res: any) => {
            this.widgetTags = { rawWidgetTags: {}, totalQueries: 0, tags: [] };
            for (let i = 0; res && i < res.results.length; i++) {
                const [wid, qid] = res.results[i].id ? res.results[i].id.split(':') : [null, null];
                if (!wid) { continue; }
                const keys = res.results[i].tagKeys.map(d => d.name);
                if (!this.widgetTags.rawWidgetTags[wid]) {
                    this.widgetTags.rawWidgetTags[wid] = {};
                }
                this.widgetTags.rawWidgetTags[wid][qid] = keys;
                this.widgetTags.totalQueries++;
                this.widgetTags.tags = [...this.widgetTags.tags,
                ...keys.filter(k => this.widgetTags.tags.indexOf(k) < 0)];
            }
            this.widgetTags.tags.sort(this.utilService.sortAlphaNum);
            this.isWidgetTagsLoaded = true;
            this.isWidgetTagsLoaded$.next(true);
        },
            error => {
                this.isWidgetTagsLoaded = true;
                this.isWidgetTagsLoaded$.next(true);
            });
    }

    /** FORM CONTROL QUICK ACCESSORS */
    get FC_layout() {
        return this.widgetConfigMultigraph.get('layout');
    }

    get FC_chart() {
        return this.widgetConfigMultigraph.get('chart');
    }

    get FC_gridOpts_viewportDisplay() {
        return this.widgetConfigMultigraph.get('gridOptions').get('viewportDisplay');
    }

    get FC_gridOpts_custom_x() {
        return this.widgetConfigMultigraph.get('gridOptions').get('custom').get('x');
    }

    get FC_gridOpts_custom_y() {
        return this.widgetConfigMultigraph.get('gridOptions').get('custom').get('y');
    }

}
