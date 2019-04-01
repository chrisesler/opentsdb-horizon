import {
    Component,
    OnInit,
    OnChanges,
    SimpleChanges,
    Input,
    Output,
    EventEmitter,
    HostBinding
} from '@angular/core';
import { HttpService } from '../../../../../core/http/http.service';


@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dropdown-metric-tags',
    templateUrl: './dropdown-metric-tags.component.html',
    styleUrls: []
})
export class DropdownMetricTagsComponent implements OnInit, OnChanges {

    @HostBinding('class.dropdown-metric-tags') private _hostClass = true;

    @Input() namespace;
    @Input() metric;
    @Input() selected = [];
    @Output() change = new EventEmitter();

    tagOptions = [];
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
        if (load) {
            this.httpService.getNamespaceTagKeys(query).subscribe(res => {
                this.tagOptions = res;
                console.log('tags', this.tagOptions);
            },
                err => {
                    this.tagOptions = [];
                });
        }
    }

    setTags(e) {
        const values = e.value;
        // if ( ! values.length ) {
        // values = ['all'];
        // } else if ( this.selected && this.selected.indexOf('all') !== -1 && values.length > 1 ) {
        const allIndex = values.findIndex(d => d === 'all');
        if (allIndex !== -1) {
            values.splice(allIndex, 1);
        }
        // }
        this.change.emit(values);
    }
}
