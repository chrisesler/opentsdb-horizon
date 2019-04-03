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
    @Input() metric: string;
    @Input() selected: any[] = ['all'];
    @Output() change: EventEmitter<any> = new EventEmitter();

    tagOptions: any[] = [];

    constructor(private httpService: HttpService) { }

    ngOnInit() {
        // tslint:disable-next-line:arrow-return-shorthand
        this.tagOptions = this.selected ? this.selected.map(d => { return { name: d }; }) : [];
    }

    ngOnChanges(change: SimpleChanges) {
        console.log('metric tags', change);
        if (change.selected && change.selected.currentValue) {
            this.selected = [...change.selected.currentValue]; // dropdown selection reflects when new reference is created
        }
    }

    loadTags(load) {
        const query: any = { namespace: this.namespace, metrics: [this.metric], filters: [] };
        query.search = '';
        const that = this;
        if (load) {
            this.httpService.getNamespaceTagKeys(query).subscribe(res => {
                console.log('RESPONSE', res);
                this.tagOptions = res;
                console.log('tags', this.tagOptions);
                setTimeout(function() {
                    that.trigger.openMenu();
                }, 100);
            },
            err => {
                this.tagOptions = [];
                setTimeout(function() {
                    that.trigger.openMenu();
                }, 100);
            });
        }
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
        console.log('event', event, selected);
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
