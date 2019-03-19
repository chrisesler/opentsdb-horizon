import {
    Component,
    HostBinding,
    Input,
    OnInit, HostListener, ElementRef, Output, EventEmitter, ViewChild
} from '@angular/core';
import { UtilsService } from '../../../../../core/services/utils.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MatMenuTrigger } from '@angular/material';



@Component({
    // tslint:disable-next-line:component-selector
    selector: 'query-editor-proto',
    templateUrl: './query-editor-proto.component.html',
    styleUrls: []
})
export class QueryEditorProtoComponent implements OnInit {

    @HostBinding('class.query-editor-proto') private _hostClass = true;

    @Input() type;
    @Input() query: any;
    @Input() label = '';
    @Input() edit = [];
    @Output() queryOutput = new EventEmitter;

    @ViewChild('tagFilterMenuTrigger', {read: MatMenuTrigger})  tagFilterMenuTrigger: MatMenuTrigger;



    editNamespace = false;
    editTag = false;
    isAddMetricProgress = false;

    timeAggregatorOptions: Array<any> = [
        {
            label: 'Sum',
            value: 'sum'
        },
        {
            label: 'Min',
            value: 'min'
        },
        {
            label: 'Max',
            value: 'max'
        },
        {
            label: 'Avg',
            value: 'avg'
        }
    ];

    queryChanges$: BehaviorSubject<boolean>;
    queryChangeSub: Subscription;

    constructor(private elRef: ElementRef, private utils: UtilsService ) { }

    ngOnInit() {
        this.queryChanges$ = new BehaviorSubject(false);

        this.queryChangeSub = this.queryChanges$
                                        .pipe(
                                            debounceTime(1000)
                                        )
                                        .subscribe( trigger => {
                                            if ( trigger ) {
                                                this.triggerQueryChanges();
                                            }
                                        });
    }

    saveNamespace(namespace ) {
        this.query.namespace = namespace;
        this.editNamespace = false;
        this.triggerQueryChanges();
    }

    cancelSaveNamespace(e) {
        this.editNamespace = false;
    }

    updateMetric(metrics, index) {
        if ( index ) {
            this.query.metrics[index].name = metrics[0];
        } else {
            for ( let i = 0; i < metrics.length; i++ ) {
                const id = this.utils.generateId();
                const oMetric = {
                                    id: id,
                                    name: metrics[i],
                                    filters: [],
                                    settings: {
                                        visual: {
                                            visible: true,
                                            color: 'auto',
                                            label: ''
                                        }
                                    },
                                    tagAggregator: 'sum',
                                    aggregatorTags: []
                                };
                this.query.metrics.push(oMetric);
            }
        }
        this.queryChanges$.next(true);
    }

    updateFilters(filters) {
        this.query.filters = filters;
        this.queryChanges$.next(true);
    }

    setMetricTagAggregator(id, value) {
        const index  = this.query.metrics.findIndex( item => item.id === id );
        if ( index !== -1 ) {
            this.query.metrics[index].tagAggregator = value;
            this.queryChanges$.next(true);
        }
    }



    setMetricGroupByTags(id, tags) {
        const index  = this.query.metrics.findIndex( item => item.id === id );
        if ( index !== -1 ) {
            this.query.metrics[index].groupByTags = tags;
            this.queryChanges$.next(true);
        }
    }
    addFunction() {
        // do something
    }

    showMetricAC() {

    }

    requestChanges(action, data= {}) {
        const message = {
                            id: this.query.id,
                            action : action,
                            payload : data
                        };
        this.queryOutput.emit(message);
    }

    triggerQueryChanges() {
        this.requestChanges('QueryChange', {'query': this.query});
    }

    showTagFilterMenu() {
        this.tagFilterMenuTrigger.openMenu();
    }
    ngOnDestroy() {
        this.queryChangeSub.unsubscribe();
    }
}
