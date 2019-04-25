import {
    Component,
    OnInit,
    OnChanges,
    SimpleChanges,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    ViewChild
} from '@angular/core';
import { HttpService } from '../../../../../core/http/http.service';
import { MatMenuTrigger } from '@angular/material';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dropdown-metric-tags',
    templateUrl: './dropdown-metric-tags.component.html',
    styleUrls: []
})
export class DropdownMetricTagsComponent implements OnInit, OnChanges {

    @HostBinding('class.dropdown-metric-tags') private _hostClass = true;

    @ViewChild(MatMenuTrigger) private trigger: MatMenuTrigger;

    @Input() namespace: string;
    @Input() metric: any;
    @Input() selected: any[] = ['all'];
    @Input() tags: any = null;
    @Input() all: boolean = true;
    @Output() change: EventEmitter<any> = new EventEmitter();

    tagOptions: any[] = [];

    constructor(private httpService: HttpService) { }

    ngOnInit() {
        // tslint:disable-next-line:arrow-return-shorthand
        this.tagOptions = this.selected ? this.selected.map(d => { return { name: d }; }) : [];
    }

    ngOnChanges(change: SimpleChanges) {
        if (change.selected && change.selected.currentValue) {
            this.selected = [...change.selected.currentValue]; // dropdown selection reflects when new reference is created
        }
    }

    loadTags(load) {
        const query: any = { namespace: this.namespace, metrics: Array.isArray(this.metric) ? this.metric : [this.metric] , filters: [] };
        query.search = '';
        if (load ) {
            if ( !this.namespace || !this.metric ) {
                this.tagOptions = this.tags && this.tags.length ? this.tags.map(d=>  { return { name: d } } ) : [];
                this.triggerMenu();
                return;
            }
            this.httpService.getNamespaceTagKeys(query).subscribe(res => {
                this.tagOptions = res;
                this.triggerMenu();
            },
            err => {
                this.tagOptions = [];
                this.triggerMenu();
            });
        }
    }

    triggerMenu() {
        const self = this;
        setTimeout(function() {
            self.trigger.openMenu();
        }, 100);
    }

    // maybe get rid of this now?
    setTags(e) {
        let values = e.value;
        if ( ! values.length ) {
            values = [];
        // } else if ( this.selected && this.selected.indexOf('all') !== -1 && values.length > 1 ) {
        } else if (values.length > 1 && values.indexOf('all')) {
            const allIndex = values.findIndex(d => d === 'all');
            if (allIndex !== -1) {
                values.splice(allIndex, 1);
            }
        }
        this.change.emit(values);
    }

    onTagSelection(event, selected) {
        let value;
        if (event.option.value === 'all' && event.option.selected) {
            value = [];
        } else {
            value = selected.map(d => d.value);

            if (value.length > 1) {
                const allIndex = value.findIndex(d => d === 'all');
                if (allIndex !== -1) {
                    value.splice(allIndex, 1);
                }
            }
        }
        this.change.emit(value);
    }

    optionIsSelected(val: string) {
        if (this.selected && this.selected.length) {
            if (val !== 'all' && this.selected.indexOf(val) >= 0) {
                return true;
            } else {
                return false;
            }
        } else {
            return val === 'all';
        }
    }
}
