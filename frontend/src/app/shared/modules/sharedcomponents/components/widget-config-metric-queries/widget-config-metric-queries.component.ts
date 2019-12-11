import {
    Component, OnInit, HostBinding, Input, Output, ElementRef, EventEmitter, OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';

import {
    MatDialog, MatDialogConfig, MatDialogRef, DialogPosition
} from '@angular/material';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

import {
    SearchMetricsDialogComponent
} from '../search-metrics-dialog/search-metrics-dialog.component';

import { InlineQueryEditorComponent } from '../inline-query-editor/inline-query-editor.component';

import { Subscription } from 'rxjs';
import { UtilsService } from '../../../../../core/services/utils.service';
import { FormControl } from '@angular/forms';

interface IMetricQueriesConfigOptions {
    enableMultipleQueries?: boolean;
    enableGroupBy?: boolean;
    enableSummarizer?: boolean;
    enableMultiMetricSelection?: boolean;
    // toggleMetric?: boolean;  // future use
}

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-metric-queries',
    templateUrl: './widget-config-metric-queries.component.html',
    styleUrls: []
})
export class WidgetConfigMetricQueriesComponent implements OnInit, OnDestroy, OnChanges {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.metric-queries-configuration') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;
    @Input() options: IMetricQueriesConfigOptions;
    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Dialogs */
    // search metrics dialog
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;

    // Inline Query Editor
    inlineQueryEditorDialog: MatDialogRef<InlineQueryEditorComponent> | null;
    inlineQueryEditorDialogSub: Subscription;

    /** Local variables */

    modGroup: any; // current group that is adding metric
    mgroupId = undefined;

    // lookup table for selected icons
    // primarily for checkboxes that have intermediate states
    selectedToggleIcon: any = {
        'none': 'check_box_outline_blank',
        'all': 'check_box',
        'some': 'indeterminate_check_box'
    };

    editQuery: any;
    queryEditMode = false;
    showNewQueryEditor = false;
    newQueryId = '';
    editQueryId = '';
    selectAllToggle: String = 'none'; // none/all/some
    tplVariables: any = {};
    appliedTplVariables: any[] = [];
    applyTplControl: FormControl;
    hasCustomFilter = false;
    private subscription: Subscription = new Subscription();

    constructor(
        public dialog: MatDialog,
        private interCom: IntercomService,
        private util: UtilsService,
        private elRef: ElementRef
    ) { }

    ngOnInit() {
        this.initOptions();

        this.subscription.add(this.interCom.responseGet().subscribe(message => {
            if (message.action === 'TplVariables') {
                this.tplVariables = message.payload.tplVariables.editTplVariables;
                this.appliedTplVariables = message.payload.mode === 'view' ?
                    message.payload.tplVariables.viewTplVariables : message.payload.tplVariables.editTplVariables;
            }
        }));
        this.interCom.requestSend({
            action: 'GetTplVariables'
        });

        if (!this.widget.settings.hasOwnProperty('useDBFilter') || this.widget.settings.useDBFilter) {
            this.applyTplControl = new FormControl('apply');
        } else {
            this.applyTplControl = new FormControl('not_apply');
        }
        if (this.applyTplControl) {
            this.applyTplControl.valueChanges.subscribe(val => {
                const flag = (val === 'apply') ? true : false;
                this.widgetChange.emit({ action: 'ToggleDBFilterUsage', payload: { apply: flag, reQuery: true }});
            });
        }
        this.checkCustomFilter(this.widget);
    }

    initOptions() {
        const defaultOptions = {
            'enableGroupBy': true,
            'enableSummarizer': false,
            'enableMultipleQueries': false,
            'enableMultiMetricSelection': true };
        this.options = Object.assign(defaultOptions, this.options);
    }

    displayDBFilterOption(): boolean {
        if (this.appliedTplVariables.length > 0) {
                return true;
            }
        return false;
    }

    addNewQuery() {
        this.widget.queries.push(this.getNewQueryConfig());
    }

    getNewQueryConfig() {
        // const gconfig = this.util.getObjectByKey(this.widget.query.groups, 'id', gid);
        const query: any = { namespace: '' , metrics: [], filters: [] };
        switch (this.widget.settings.component_type) {
            case 'LinechartWidgetComponent':
            case 'HeatmapWidgetComponent':
            case 'BarchartWidgetComponent':
            case 'DonutWidgetComponent':
            case 'TopnWidgetComponent':
                query.settings = {
                                    visual: {
                                        visible: true,
                                    }
                                };
                break;
            case 'BignumberWidgetComponent':
                    query.settings = {
                        visual: {
                            visible: true,
                            queryID: 0
                        }
                    };
        }
        query.id = this.util.generateId(3, this.util.getIDs(this.widget.queries));
        return query;
    }

    getQueryLabel(query) {
        const index = this.widget.queries.findIndex(q => q.id === query.id);
        const label = 'Q' + (index + 1);
        return label;
    }

    ngOnChanges(changes: SimpleChanges) {
        // when editing mode is loaded, we need to temporary adding default UI state
        // to editing widget
        if ( changes.widget.currentValue ) {
            if ( !changes.widget.currentValue.queries.length ) {
                this.addNewQuery();
            }
        }
    }

    handleQueryRequest(message: any) {
        switch ( message.action ) {
            case 'SetQueryEditMode':
                this.queryEditMode = true;
                const queries = this.widget.queries.filter( query => query.id === message.id );
                this.editQuery = { query: queries[0], edit: message.payload.edit, type: this.widget.settings.component_type };
                this.widgetChange.emit({ action: 'SetQueryEditMode', payload: { id: message.id }});
                break;
            case 'CloseQueryEditMode':
                this.widgetChange.emit({ action: 'CloseQueryEditMode' });
                this.queryEditMode = false;
                this.editQuery = null;
                break;
            case 'ToggleQueryVisibility':
                this.widgetChange.emit({ id: message.id, action: 'ToggleQueryVisibility' });
                break;
            case 'ToggleQueryMetricVisibility':
                this.widgetChange.emit({ id: message.id, action: 'ToggleQueryMetricVisibility', payload: {  mid: message.payload.mid }});
                break;
            case 'CloneQuery':
                this.widgetChange.emit({ id: message.id, action: 'CloneQuery' });
                break;
            case 'DeleteQuery':
                this.widgetChange.emit({ id: message.id, action: 'DeleteQuery' });
                break;
            case 'DeleteQueryMetric':
                this.widgetChange.emit({ id: message.id, action: 'DeleteQueryMetric', payload: {  mid: message.payload.mid }});
                break;
            case 'DeleteQueryFilter':
                this.widgetChange.emit({ id: message.id, action: 'DeleteQueryFilter', payload: {  findex: message.payload.findIndex }});
                break;
            case 'QueryChange':
                this.updateQuery(message.payload.query);
                break;
            case 'SummarizerChange':
                this.widgetChange.emit({ id: message.id, action: 'SummarizerChange', payload:  { summarizer: message.payload.summarizer }});
                break;
        }
    }

    updateQuery(query) {
        console.log('widget-query :: updateQuery, query, gid', query);
        query.metrics = this.updateLabelsForTimeShift(query.metrics);
        const payload = { action: 'UpdateQuery', payload: { query: query } };
        this.newQueryId = '';
        this.widgetChange.emit(payload);

        // check if user manually add dashboard tag filters to common tags
        // clone it so we can handle it here
        const cWidget = this.util.deepClone(this.widget);
        const qIndx = cWidget.queries.findIndex(q => q.id === query.id);
        if (qIndx === -1) {
            cWidget.queries.push(query);
        } else {
            cWidget.queries[qIndx] = query;
        }
        this.checkCustomFilter(cWidget);
        if (this.hasCustomFilter) {
            // set useDBFilter to true anyway
            this.applyTplControl.setValue('apply');
            this.widgetChange.emit({ action: 'ToggleDBFilterUsage', payload: { apply: true, reQuery: true }});
        }
    }

    // check if filters of a query have customFilter values
    // check all queries of this widget, not just
    checkCustomFilter(widget: any) {
        this.hasCustomFilter = false;
        for (let i = 0; i < widget.queries.length; i++) {
            const idx = widget.queries[i].filters.findIndex(f => f.customFilter && f.customFilter.length > 0);
            if (idx > -1) {
                this.hasCustomFilter = true;
                break;
            }
        }
    }

    updateLabelsForTimeShift(metrics: any[]) {
        for (const metric of metrics) {
            const totalTimeShift = this.util.getTotalTimeShift(metric.functions);
            if (totalTimeShift) {
                if (metric.settings.visual.label === '' || metric.settings.visual.label.startsWith( metric.name + '-')) {
                    metric.settings.visual.label = metric.name + '-' + totalTimeShift;
                }
            } else { // timeshift potentially removed
                if (metric.settings.visual.label && metric.settings.visual.label.startsWith(metric.name + '-')) {
                    metric.settings.visual.label = '';
                }
            }
        }
        return metrics;
    }

    // to add or remove the local tempUI state
    addRemoveTempUIState(add: boolean, widget: any) {
        for (let i = 0; i < this.widget.queries.length; i++) {
            const query = this.widget.queries[i];
            if (add) {
                query.settings.tempUI = {
                    selected: 'none',
                    collapsed: false
                }
            } else {
                delete query.settings.tempUI;
            }
            for (let j = 0; j < query.metrics.length; j++) {
                const metric = query.metrics[j];
                if(add) {
                    metric.settings.selected = false;
                    metric.settings.expanded = false;
                } else {
                    delete metric.settings.selected;
                }
            }
        }
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.searchMetricsDialog = undefined;
    }

    // opens the dialog window to search and add metrics
    openTimeSeriesMetricDialog(mgroupId: string) {
        // console.log('%cMGROUP', 'background: purple; color: white;', mgroupId);
        // do something
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.width = '100%';
        dialogConf.maxWidth = '100%';
        dialogConf.height = 'calc(100% - 48px)';
        dialogConf.backdropClass = 'search-metrics-dialog-backdrop';
        dialogConf.panelClass = 'search-metrics-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };
    }


    openInlineQueryEditorDialog(query: any) {
        // console.log('%cInlineQueryDialog', 'background: purple; color: white;', query);
        const parentPos = this.elRef.nativeElement.closest('.widget-controls-container').getBoundingClientRect();
        // console.log("parentpos", parentPos);
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        const offsetHeight = 60;
        dialogConf.width = parentPos.width + 'px';
        dialogConf.maxWidth = '100%';
        dialogConf.height = (parentPos.height - offsetHeight) + 'px';
        dialogConf.backdropClass = 'inline-query-editor-dialog-backdrop';
        dialogConf.panelClass = 'inline-query-editor-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: (parentPos.top + offsetHeight) + 'px',
            bottom: '0px',
            left: parentPos.left + 'px',
            right: '0px'
        };
        // console.log("dialogConf", dialogConf.position);
        dialogConf.data = query;

        this.inlineQueryEditorDialog = this.dialog.open(InlineQueryEditorComponent, dialogConf);
        // this.inlineQueryEditorDialog.updatePosition({top: '48px'});

        this.inlineQueryEditorDialog.afterClosed().subscribe((dialog_out: any) => {
            console.log('openInlineQueryEditorDialog::afterClosed', dialog_out);
            // this.modGroup = dialog_out.mgroup;
            // this.widgetChange.emit({action: 'AddMetricsToGroup', payload: { data: this.modGroup }});
            // console.log('...expression return...', this.modGroup);
        });
    }


    toggle_displayGroupsIndividually(event: any) {
        // console.log('TOGGLE::DisplayGroupsIndividually', event);
    }

    toggle_groupSelected(group: any, event: MouseEvent) {
        // console.log('TOGGLE::GroupSelected', group, event);
        event.stopPropagation();

        // some or none are selected, then we select them all
        if (group.settings.tempUI.selected === 'some' || group.settings.tempUI.selected === 'none') {
            group.settings.tempUI.selected = 'all';
            group.queries.forEach(function(metric) {
                metric.settings.selected = true;
            });
        } else {
            group.settings.tempUI.selected = 'none';
            group.queries.forEach(function(metric) {
                metric.settings.selected = false;
            });
        }

        // update master checkbox
        const groupStates = {
            all: 0,
            none: 0,
            some: 0
        };

        for (let i = 0; i < this.widget.query.groups; i++) {
            let g = this.widget.query.groups[i];
            if (g.settings.tempUI.selected === 'all') {
                groupStates.all++;
            } else if (g.settings.tempUI.selected === 'some') {
                groupStates.some++;
            } else {
                groupStates.none++;
            }
        }

        this.selectAllToggle = (groupStates.some > 0 || groupStates.all < this.widget.query.groups.length) ?
            'some' : (groupStates.none === this.widget.query.groups.length) ? 'none' : 'all';
    }

    toggle_metricSelected(metric: any, group: any, event: MouseEvent) {
        // console.log('TOGGLE::MetricSelected', group, event);
        event.stopPropagation();

        metric.settings.selected = !metric.settings.selected;

        const selectedGroupMetrics = group.queries.filter(function(m) {
            return m.settings.selected;
        });

        // the 'some' case
        if (selectedGroupMetrics.length > 0 && selectedGroupMetrics.length < group.queries.length) {
            group.settings.tempUI.selected = 'some';
            // if this is some, then the master level is some as well
            this.selectAllToggle = 'some';
        // the 'all'case
        } else if (selectedGroupMetrics.length === group.queries.length) {
            group.settings.tempUI.selected = 'all';

            const selectedGroups = this.widget.query.groups.filter(function(g) {
                return g.settings.tempUI.selected === 'all';
            });

            this.selectAllToggle = (selectedGroups.length === this.widget.query.groups.length) ? 'all' : 'some';

        // the 'none' case
        } else {
            group.settings.tempUI.selected = 'none';

            const selectedGroups = this.widget.query.groups.filter(function(g) {
                return g.settings.tempUI.selected !== 'none';
            });

            this.selectAllToggle = (selectedGroups.length > 0) ? 'some' : 'none';
        }
    }

    toggleExpressionCollapsed(expression, group, $event) {
        event.stopPropagation();
        expression.settings.expanded = !expression.settings.expanded;
    }

    toggle_groupCollapsed(group: any, event: MouseEvent) {
        // console.log('TOGGLE::GroupCollapsed', group, event);
        event.stopPropagation();
        group.collapsed = !group.collapsed;
    }

    clone_queryGroup(group: any, event: MouseEvent) {
        // console.log('DUPLICATE QUERY Group ', group);
        event.stopPropagation();
        // do something
    }

    deleteGroup(gIndex) {
        // console.log('DELETE QUERY GROUP ', gIndex);
        this.widgetChange.emit( {'action': 'DeleteGroup', payload: { gIndex: gIndex }});
        // do something
    }

    toggleGroup(gIndex) {
        // console.log('TOGGLE QUERY GROUP ', gIndex);
        this.widgetChange.emit( {'action': 'ToggleGroup', payload: { gIndex: gIndex }});
        // do something
    }

    deleteGroupQuery(gIndex, qid) {
        // console.log('DELETE QUERY ITEM ', qid);
        const queries = this.widget.query.groups[gIndex].queries;
        const index = queries.findIndex(query => query.id === qid );
        if ( this.widget.query.groups[gIndex].queries.length === 1 && index === 0 ) {
            // this.deleteGroup(gIndex);
        }
        if ( index !== -1 ) {
            this.widgetChange.emit( {'action': 'DeleteGroupQuery', payload: { gIndex: gIndex, index: index }});
        }
    }
}
