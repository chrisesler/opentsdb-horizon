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

import {
    ExpressionDialogComponent
} from '../expression-dialog/expression-dialog.component';
import { InlineQueryEditorComponent } from '../inline-query-editor/inline-query-editor.component';

import { Subscription } from 'rxjs';
import { UtilsService } from '../../../../../core/services/utils.service';

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
 
    /** Outputs */
    @Output() widgetChange = new EventEmitter;

    /** Dialogs */
    // search metrics dialog
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    searchDialogSub: Subscription;

    // expression
    metricExpressionDialog: MatDialogRef<ExpressionDialogComponent> | null;
    metricExpressionDialogSub: Subscription;

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

    constructor(
        public dialog: MatDialog,
        private interCom: IntercomService,
        private util: UtilsService,
        private elRef: ElementRef
    ) { }

    ngOnInit() {
        console.log('editting widget query', this.widget);
        if ( !this.widget.queries.length ) {
            // this.addNewQuery();
            // this.queryEditMode = true;
        }
    }

    addNewQuery() {
        this.widget.queries.push(this.getNewQueryConfig());
    }

    getNewQueryConfig() {
        // const gconfig = this.util.getObjectByKey(this.widget.query.groups, 'id', gid);
        const query: any = { namespace: '' , metrics: [], filters: [] };
        switch (this.widget.settings.component_type) {
            case 'LinechartWidgetComponent':
            case 'BarchartWidgetComponent':
            case 'DonutWidgetComponent':
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
        query.id = this.util.generateId(3);
        // this.newQueryId = query.id;
        // this.widget.queries.push(query);
        // this.showNewQueryEditor = false;
        // console.log("addNewQuery:::namepsace...", namespace, this.widget);
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
        console.log("widget config changed", changes.widget.currentValue);
        if ( changes.widget.currentValue ) {
            console.log("widget config changed", changes.widget.currentValue);
            if ( !changes.widget.currentValue.queries.length ) {
                this.addNewQuery();
            }
        }
    }

    handleQueryRequest(message) {
        switch ( message.action ) {
            case 'SetQueryEditMode':
                this.queryEditMode = true;
                console.log(JSON.stringify(this.widget), "queires...")
                const queires = this.widget.queries.filter( query => query.id === message.id );
                this.editQuery = { query: queires[0], edit: message.payload.edit, type: this.widget.settings.component_type };
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
                console.log("widget-queries:::this.widget", this.widget.queries);
                break;
        }
    }

    updateQuery(query) {
        console.log("widget-query :: updateQuery, query, gid", query);
        const payload = { action: 'UpdateQuery', payload: { query: query } };
        this.newQueryId = '';
        this.widgetChange.emit(payload);
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
        if (this.searchDialogSub) {
            this.searchDialogSub.unsubscribe();
        }
        this.searchMetricsDialog = undefined;

        if (this.metricExpressionDialogSub) {
            this.metricExpressionDialogSub.unsubscribe();
        }
        this.metricExpressionDialog = undefined;
    }

    // opens the dialog window to search and add metrics
    openTimeSeriesMetricDialog(mgroupId: string) {
        console.log('%cMGROUP', 'background: purple; color: white;', mgroupId);
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
        /*
        dialogConf.data = { mgroupId };

        this.searchMetricsDialog = this.dialog.open(SearchMetricsDialogComponent, dialogConf);
        this.searchMetricsDialog.updatePosition({top: '48px'});
        // custom emit event on the dialog, comment out but dont delete
        // this.searchDialogSub = this.searchMetricsDialog.componentInstance.onDialogApply.subscribe((data: any) => {
        //    console.log('SUBSCRIPTION DATA', data);
        // });
        // getting data passing out from dialog
        this.searchMetricsDialog.afterClosed().subscribe((dialog_out: any) => {
            this.newQueryId = '';
            this.modGroup = dialog_out.mgroup;
            this.widgetChange.emit({action: 'AddMetricsToGroup', payload: { data: this.modGroup }});
            console.log('return', this.modGroup);
        });
        */
    }

    openMetricExpressionDialog(group: any) {
        console.log('%cMGROUP', 'background: purple; color: white;', group);
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.width = '100%';
        dialogConf.maxWidth = '100%';
        dialogConf.height = 'calc(100% - 48px)';
        dialogConf.backdropClass = 'metric-expression-dialog-backdrop';
        dialogConf.panelClass = 'metric-expression-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };
        /*
        dialogConf.data = { mgroupId: group.id, queries: group.queries};

        this.metricExpressionDialog = this.dialog.open(ExpressionDialogComponent, dialogConf);
        this.metricExpressionDialog.updatePosition({top: '48px'});

        this.metricExpressionDialog.afterClosed().subscribe((dialog_out: any) => {
            console.log('openMetricExpressionDialog::afterClosed', dialog_out);
            this.modGroup = dialog_out.mgroup;
            this.widgetChange.emit({action: 'AddMetricsToGroup', payload: { data: this.modGroup }});
            console.log('...expression return...', this.modGroup);
        });
        */
    }

    openInlineQueryEditorDialog(query: any) {
        console.log('%cInlineQueryDialog', 'background: purple; color: white;', query);
        const parentPos = this.elRef.nativeElement.closest('.widget-controls-container').getBoundingClientRect();
        console.log("parentpos", parentPos);
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
        console.log("dialogConf", dialogConf.position);
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
        console.log('TOGGLE::DisplayGroupsIndividually', event);
    }

    toggle_groupSelected(group: any, event: MouseEvent) {
        console.log('TOGGLE::GroupSelected', group, event);
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
        console.log('TOGGLE::MetricSelected', group, event);
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
        console.log('TOGGLE::GroupCollapsed', group, event);
        event.stopPropagation();
        group.collapsed = !group.collapsed;
    }

    clone_queryGroup(group: any, event: MouseEvent) {
        console.log('DUPLICATE QUERY Group ', group);
        event.stopPropagation();
        // do something
    }

    deleteGroup(gIndex) {
        console.log('DELETE QUERY GROUP ', gIndex);
        this.widgetChange.emit( {'action': 'DeleteGroup', payload: { gIndex: gIndex }});
        // do something
    }

    toggleGroup(gIndex) {
        console.log('TOGGLE QUERY GROUP ', gIndex);
        this.widgetChange.emit( {'action': 'ToggleGroup', payload: { gIndex: gIndex }});
        // do something
    }

    toggleGroupQuery(gIndex, qid) {
        console.log('TOGGLE QUERY ITEM VISIBILITY');
        const queries = this.widget.query.groups[gIndex].queries;
        const index = queries.findIndex(query => query.id === qid );
        if ( index !== -1 ) {
            this.widgetChange.emit( {'action': 'ToggleGroupQuery', payload: { gIndex: gIndex, index: index }});
        }
    }

    cloneQuery(item: any, event: MouseEvent) {
        console.log('DUPLICATE QUERY ITEM ', item);
        event.stopPropagation();
        // do something
    }

    deleteGroupQuery(gIndex, qid) {
        console.log('DELETE QUERY ITEM ', qid);
        const queries = this.widget.query.groups[gIndex].queries;
        const index = queries.findIndex(query => query.id === qid );
        if ( this.widget.query.groups[gIndex].queries.length === 1 && index === 0 ) {
            // this.deleteGroup(gIndex);
        }
        if ( index !== -1 ) {
            this.widgetChange.emit( {'action': 'DeleteGroupQuery', payload: { gIndex: gIndex, index: index }});
        }
    }

    /**
     * Batch Events
     */

    batch_selectAllToggle(event: MouseEvent) {
        console.log('BATCH::SelectAllToggle', this.selectAllToggle);
        event.stopPropagation();
        let group, metric;
        if (this.selectAllToggle === 'none' || this.selectAllToggle === 'some') {
            this.selectAllToggle = 'all';
            // mark all groups as selected
            for (group of this.widget.query.groups) {
                group.settings.tempUI.selected = 'all';
                for (metric of group.queries) {
                    metric.settings.selected = true;
                }
            }
        } else {
            this.selectAllToggle = 'none';
            // mark all groups as un-selected
            for (group of this.widget.query.groups) {
                group.settings.tempUI.selected = 'none';
                for (metric of group.queries) {
                    metric.settings.selected = false;
                }
            }
        }
    }

    batch_groupMetrics(event: MouseEvent) {
        console.log('BATCH::GroupMetrics', event);
        event.stopPropagation();
        this.widgetChange.emit({action: 'MergeMetrics', payload: { data: JSON.parse(JSON.stringify(this.widget.query.groups)) }});
    }

    batch_splitMetrics(event: MouseEvent) {
        console.log('BATCH::SplitMetrics', event);
        event.stopPropagation();
        this.widgetChange.emit({action: 'SplitMetrics', payload: { data: JSON.parse(JSON.stringify(this.widget.query.groups)) }});
    }

    batch_deleteMetrics(event: MouseEvent) {
        console.log('BATCH::DeleteMetrics', event);
        event.stopPropagation();
        this.widgetChange.emit({action: 'DeleteMetrics', payload: { data: JSON.parse(JSON.stringify(this.widget.query.groups)) }});
    }

    /**
     * Other
     */

    addTimeSeriesExpression() {
        console.log('ADD TIME SERIES EXPRESSION');
        // do something
    }

}
