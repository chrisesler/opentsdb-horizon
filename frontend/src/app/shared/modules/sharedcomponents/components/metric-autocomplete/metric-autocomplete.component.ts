import {
    Component,
    OnInit,
    HostBinding,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    Renderer,
    ViewChild,
    OnChanges,
    OnDestroy,
    SimpleChanges, HostListener, AfterViewInit, AfterViewChecked
} from '@angular/core';
import { MatAutocomplete, MatMenuTrigger } from '@angular/material';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { startWith, debounceTime, catchError } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { HttpService } from '../../../../../core/http/http.service';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'metric-autocomplete',
    templateUrl: './metric-autocomplete.component.html',
    styleUrls: ['./metric-autocomplete.component.scss']
})

export class MetricAutocompleteComponent implements OnInit, OnDestroy, AfterViewInit {
    @HostBinding('class.metric-autocomplete') private _hostClass = true;
    @Input() namespace = '';
    @Input() filters = [];
    // tslint:disable-next-line:no-inferrable-types
    @Input() multiple: boolean = false;
    @Input() metrics = [];
    // tslint:disable-next-line:no-inferrable-types
    @Input() focus: boolean = true;

    @Output() metricOutput = new EventEmitter();
    @Output() blur = new EventEmitter();

    @ViewChild('metricSearchInput') metricSearchInput: ElementRef;
    @ViewChild('metricAutoComplete') metricAutoCompleteCntrl: MatAutocomplete;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    metricOptions = [];
    metricSearchControl: FormControl;
    message: any = { 'metricSearchControl': { message: '' } };
    Object = Object;

    metricSelectedTabIndex = 0;

    queryChanges$: BehaviorSubject<boolean>;
    queryChangeSub: Subscription;
    visible = false;

    // tslint:disable-next-line:no-inferrable-types
    firstRun: boolean = true;
    scrollDetect: any;

    constructor(
        private elRef: ElementRef,
        private httpService: HttpService) {
    }

    /** ANGULAR INTERFACE METHODS */
    ngOnInit() {
        console.log('metric autocomplete', this.metrics);
        this.setMetricSearch();
    }

    ngAfterViewInit() {
        if (this.focus === true) {
            setTimeout(() => {
                this.metricSearchInput.nativeElement.focus();
            }, 100);
        }
    }

    ngOnDestroy() {
    }

    /** METHODS */

    setMetricSearch() {
        this.metricSearchControl = new FormControl(this.multiple ? '' : this.metrics[0]);
        this.metricSearchControl.valueChanges
            .pipe(
                startWith(''),
                debounceTime(500)
            )
            .subscribe(value => {
                const query: any = { namespace: this.namespace, tags: this.filters };
                query.search = value ? value : '';
                this.message['metricSearchControl'] = {};
                this.firstRun = true;
                this.httpService.getMetricsByNamespace(query)
                    .subscribe(res => {
                        this.firstRun = false;
                        this.metricOptions = res;
                        if ( this.metricOptions.length === 0 ) {
                            this.message['metricSearchControl'] = { 'type': 'info', 'message': 'No data found' };
                        }
                    },
                        err => {
                            this.firstRun = false;
                            this.metricOptions = [];
                            const message = err.error.error ? err.error.error.message : err.message;
                            this.message['metricSearchControl'] = { 'type': 'error', 'message': message };
                        });
            });
    }

    doMetricSearch() {
        this.visible = true;
        if ( this.multiple && !this.trigger.menuOpen ) {
            this.trigger.openMenu();
        }
        this.metricSearchControl.updateValueAndValidity({emitEvent: false});
    }

    requestChanges() {
        if ( this.metrics.length ) {
            this.metricOutput.emit(this.metrics);
        }
    }

    updateMetricSelection(metric, operation) {
        metric = metric.trim();
        const index = this.metrics.indexOf(metric);
        if (index === -1 && operation === 'add') {
            this.metrics.push(metric);
        } else if (index !== -1 && operation === 'remove') {
            this.metrics.splice(index, 1);
        }
    }

    removeMetric(metric) {
        const index = this.metrics.indexOf(metric);
        if (index !== -1) {
            this.metrics.splice(index, 1);
        }
    }

    getMetricIndex(metric) {
        return this.metrics.indexOf(metric);
    }

    /** EVENTS */

    @HostListener('click', ['$event'])
    hostClickHandler(e) {
        e.stopPropagation();
    }

    @HostListener('document:click', ['$event.target'])
    documentClickHandler(target) {
        if (!this.elRef.nativeElement.contains(target) && this.visible) {
            if (this.multiple) {
                this.requestChanges();
                this.trigger.closeMenu();
            }
            this.blur.emit();
            this.visible = false;
        }
    }

    clickMultipleDone() {
        this.requestChanges();
        this.trigger.closeMenu();
        this.blur.emit();
        this.visible = false;
    }

    metricACKeydown(event: any) {
        if (!this.metricAutoCompleteCntrl.isOpen) {
            this.metrics[0] = this.metricSearchControl.value;
            this.requestChanges();
            this.blur.emit();
        }
    }

    metricACOptionSelected(event: any) {
        this.metrics[0] = event.option.value;
        this.requestChanges();
        this.blur.emit();
    }

    multipleMenuOpened() {
        this.scrollDetect = this.scrollDetect_event.bind(this);
        window.addEventListener('scroll', this.scrollDetect, true);
    }

    multipleMenuClosed() {
        window.removeEventListener('scroll', this.scrollDetect);
        this.scrollDetect = undefined;
    }

    scrollDetect_event(event) {
        const srcEl = event.srcElement;

        if (!srcEl.classList.contains('metric-search-result') && !this.elRef.nativeElement.contains(srcEl)) {
            // this.trigger.closeMenu();
        }
    }


}
