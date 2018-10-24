import {
    Component, Inject, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy
} from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidatorFn } from '@angular/forms';

import {
    MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogConfig, DialogPosition
} from '@angular/material';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

import {
    SearchMetricsDialogComponent
} from '../search-metrics-dialog/search-metrics-dialog.component';

import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators/debounceTime';

import { HttpService } from '../../../../../core/http/http.service';
import { DatatranformerService } from '../../../../../core/services/datatranformer.service';
import { QueryService } from '../../../../../core/services/query.service';
import { IDygraphOptions } from '../../../dygraphs/IDygraphOptions';

/*
export function expressionValidator(metrics: any[]): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
        const value = control.value.trim();
        const keys = Object.keys(metrics);
        const result = value.match(/((m|e)[0-9]+)/gi);
        const invalidRefs = [];

        for (let i = 0; result && i < result.length; i++ ) {
            const metricRefId = result[i];
            if ( keys.indexOf(metricRefId) === -1 ) {
                invalidRefs.push( metricRefId );
            }
        }
        console.log("comes ehree...", control);
      return (!result || invalidRefs.length) && value.length !== 0 ? {'invalid':  true } : null;
    };
  }
  */

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'expression-dialog',
    templateUrl: './expression-dialog.component.html',
    styleUrls: []
})
export class ExpressionDialogComponent implements OnInit, OnDestroy {
    @HostBinding('class.metric-expression-dialog') private _hostClass = true;

    /** Dialogs */
    // search metrics dialog
    searchMetricsDialog: MatDialogRef<SearchMetricsDialogComponent> | null;
    searchDialogSub: Subscription;

    /** Local variables */
    modGroup: any; // current group that is adding metric
    mgroupId = undefined;

    /** Form Group */
    metricExpressionForm: FormGroup;

    // subscriptions
    metricExpressionForm_Sub: Subscription;

    // form values
    expressionName: string;
    expressionValue: string;
    metrics: any[] = [];
    group: any = {
        id: '',
        queries: [],
        settings: {
            visual: {
                visible: true
            }
        }
    };
    chartType = 'line';
    options: IDygraphOptions = {
        labels: ['x'],
        connectSeparatedPoints: true,
        drawPoints: false,
        labelsDivWidth: 0,
        legend: 'never',
        stackedGraph: true,
        hightlightCircleSize: 1,
        strokeWidth: 1,
        strokeBorderWidth: 1,
        highlightSeriesOpts: {
            strokeWidth: 3,
            strockeBorderWidth: 1,
            hightlightCircleSize: 5
        },
        visibility: []
    };
    data: any = [[0]];
    size: any = {};

    Object = Object;

    constructor(
        public dialog: MatDialog,
        private interCom: IntercomService,
        public dialogRef: MatDialogRef<SearchMetricsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public dialog_data: any,
        private httpService: HttpService,
        private dataTransformerService: DatatranformerService,
        private queryService: QueryService,
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        this.createForm();
        console.log('%cDIALOG DATA', 'background: lime; color: white;', this.dialog_data);
        for ( let index = 1,  i = 0; i < this.dialog_data.queries.length; i++ ) {
            // only metrics for now
            if ( this.dialog_data.queries[i].metric ) {
                const k = 'm' + index;
                this.metrics[k] = this.dialog_data.queries[i];
                index++;
            }
        }
        if (this.dialog_data.mgroupId === undefined) {
            // we will create new groups based on number of metrics
            this.group.id = 'new';
        } else {
            this.group.id = this.dialog_data.mgroupId;
        }
    }

    ngOnDestroy() {
        // destroy any subscriptions
        this.metricExpressionForm_Sub.unsubscribe();
    }

    createForm() {
        this.metricExpressionForm = this.fb.group({
            expressionName:     new FormControl('untitled expression'),
            expressionValue:    new FormControl('')
        });

        // JUST CHECKING VALUES
        this.metricExpressionForm_Sub = this.metricExpressionForm.valueChanges
                                            .pipe(debounceTime(3000))
                                            .subscribe(function(data) {
                                                if ( this.isValidExpression() && this.metricExpressionForm.valid ) {
                                                    this.queryData();
                                                }
                                            }.bind(this));
    }

    isValidExpression() {
        const value = this.metricExpressionForm.controls.expressionValue.value.trim();
        const keys = Object.keys(this.metrics);
        const result = value.match(/((m|e)[0-9]+)/gi);
        const invalidRefs = [];

        for (let i = 0; result && i < result.length; i++ ) {
            const metricRefId = result[i];
            if ( keys.indexOf(metricRefId) === -1 ) {
                invalidRefs.push( metricRefId );
            }
        }

        const isValid =  result != null && !invalidRefs.length;
        this.metricExpressionForm.controls.expressionValue.setErrors( !isValid ? { 'invalid': true } : null );
        return isValid;
    }
    /**
     * Services
     */


    /**
     * Dialogs
     */

    // opens the dialog window to search and add metrics
    openTimeSeriesMetricDialog(mgroupId: string) {
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
        dialogConf.data = { mgroupId: this.mgroupId };

        this.searchMetricsDialog = this.dialog.open(SearchMetricsDialogComponent, dialogConf);
        this.searchMetricsDialog.updatePosition({top: '48px'});
        // custom emit event on the dialog, comment out but dont delete
        // this.searchDialogSub = this.searchMetricsDialog.componentInstance.onDialogApply.subscribe((data: any) => {
        //    console.log('SUBSCRIPTION DATA', data);
        // });
        // getting data passing out from dialog
        this.searchMetricsDialog.afterClosed().subscribe((gData: any) => {
            const len = Object.keys(this.metrics).length;
            for ( let i = 0; i < gData.mgroup.queries.length; i++ ) {
                const k = 'm' + ( len + i + 1);
                this.metrics[k] = gData.mgroup.queries[i];
            }
        });
    }

    queryData() {

            const widget = {
                                settings: {
                                    data_source: 'yamas',
                                    component_type: 'LinechartWidgetComponent'
                                }
                        };
            const time = {
                start: '1h-ago'
            };
            const expression = this.getExpressionConfig();
            const metrics = [expression];
            const query = this.queryService.buildQuery(widget, time, metrics);
            this.getYamasData(query, metrics);
    }

    // to get query for selected metrics, my rebuild to keep time sync 1h-ago
    getYamasData(query: any, metrics) {
        this.httpService.getYamasData(query).subscribe(
            result => {
                const groupData = {};
                groupData[this.group.id] = result;
                const config = {
                                    query: {
                                        groups: []
                                    }
                                };
                this.group.queries = metrics;
                config.query.groups[0] = this.group;
                this.data = this.dataTransformerService.yamasToDygraph(config, this.options, [[0]] , groupData);
            },
            err => {
                console.log('error', err);
            }
        );
    }

    /**
     * Behaviors
     */

    // handle when clicked on cancel
    onClick_Cancel(): void {
        this.dialogRef.close();
    }

    // handle when clicked on apply
    onClick_Apply(): any {
        this.group.queries = [];
        if ( this.isValidExpression() && this.metricExpressionForm.valid ) {
            this.group.queries[0] = this.getExpressionConfig();
            this.dialogRef.close({ mgroup: this.group});
        }
    }

    getExpressionConfig() {
        let expInput = this.metricExpressionForm.controls.expressionValue.value;
        const result = expInput.match(/((m|e)[0-9]+)/gi);
        const metrics = [];
        let tags = [];
        const replace = [];

        for (let i = 0; i < result.length; i++ ) {
            const metricRefId = result[i];
            const newRefId =  'm' + (i + 1);
            const metric = {
                id: newRefId,
                metric : this.metrics[metricRefId].metric
            };
            if ( metricRefId !== newRefId) {
                replace.push( { 'old': metricRefId, 'new': newRefId } );
            }
            metrics.push(metric);
            // find common tags
            if ( i === 0) {
                tags = [...this.metrics[metricRefId].filters];
            } else {
                const newTags = [...this.metrics[metricRefId].filters];
                tags = tags.filter( a => {
                                            return newTags.some( b => {
                                                if ( a.tagk === b.tagk ) {
                                                    a.filter = '*';
                                                    a.groupBy = a.groupBy && b.groupBy;
                                                    return true;
                                                }
                                                return false;
                                            });
                                });
            }
        }

        // update the expression with new reference ids
        for ( let i = 0; i < replace.length; i++ ) {
            const regex = new RegExp( replace[i].old , 'g');
            expInput = expInput.replace( regex, replace[i].new);
        }

        const expression = {
            expression : expInput,
            settings: {
                visual: {
                    label: this.metricExpressionForm.controls.expressionName.value,
                    visible: true
                }
            },
            filters: tags,
            metrics: metrics
        };
        return expression;
    }
     /**
     * Individual Events
     */

     /**
     * Batch Events
     */

     /**
     * Other
     */

}
