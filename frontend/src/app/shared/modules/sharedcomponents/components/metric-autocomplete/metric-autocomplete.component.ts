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
import { MatAutocomplete } from '@angular/material';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { startWith, debounceTime, catchError } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { HttpService } from '../../../../../core/http/http.service';
import { UtilsService } from '../../../../../core/services/utils.service';

@Component({
  selector: 'metric-autocomplete',
  templateUrl: './metric-autocomplete.component.html',
  styleUrls: ['./metric-autocomplete.component.scss']
})

export class MetricAutocompleteComponent implements OnInit, OnDestroy, AfterViewInit {
  @HostBinding('class.metric-autocomplete') private _hostClass = true;
  @Input() namespace ='';
  @Input() filters = [];
  @Input() multiple: boolean = false;
  @Input() metrics = [];
  @Input() focus: boolean = true;

  @Output() metricOutput = new EventEmitter();
  @Output() blur = new EventEmitter();

  @ViewChild('metricSearchInput') metricSearchInput: ElementRef;
  @ViewChild('metricAutoComplete') metricAutoCompleteCntrl: MatAutocomplete;

  metricOptions = [];
  metricSearchControl: FormControl;
  message:any = {  'metricSearchControl': { message : ''} };
  Object = Object;

  metricSelectedTabIndex = 0;


  queryChanges$: BehaviorSubject<boolean>;
  queryChangeSub: Subscription;
  visible = false;

    constructor(
        private elRef: ElementRef,
        private httpService: HttpService) {
    }

    ngOnInit() {
        this.setMetricSearch();
    }

    ngAfterViewInit() {
        if ( this.focus === true  ) {
            setTimeout(()=>this.metricSearchInput.nativeElement.focus(), 100);
        }
    }

    setMetricSearch() {
        this.metricSearchControl = new FormControl(!this.multiple ? this.metrics[0] : '');
        this.metricSearchControl.valueChanges
        .pipe(
            debounceTime(200)
        )
        .subscribe( value => {
            const query: any = { namespace: this.namespace, tags: this.filters };
            query.search = value ? value : '';
                this.message['metricSearchControl'] = {};
                this.httpService.getMetricsByNamespace(query)
                                    .subscribe(res => {
                                        this.metricOptions = res;
                                    },
                                    err => {
                                        this.metricOptions = [];
                                        const message = err.error.error? err.error.error.message : err.message;
                                        this.message['metricSearchControl'] = { 'type': 'error', 'message' : message };
                                    }
                                    );
        });
    }

    doMetricSearch() {
        this.visible = true;
        this.metricSearchControl.setValue(this.multiple ? null: this.metrics[0]);
    }

    requestChanges() {
        this.metricOutput.emit(this.metrics);
    }

    updateMetricSelection(metric, operation) {
        metric = metric.trim();
        const index = this.metrics.indexOf(metric);
        if ( index === -1  && operation === 'add') {
            this.metrics.push(metric);
        } else if ( index !== -1 && operation === 'remove' ) {
            this.metrics.splice(index, 1);
        }
    }
    
    removeMetric(metric) {
        const index = this.metrics.indexOf(metric);
        if ( index !== -1 ) {
            this.metrics.splice(index, 1);
        }
    }

    getMetricIndex(metric) {
        return this.metrics.indexOf(metric);
    }

    @HostListener('click', ['$event'])
    hostClickHandler(e) {
        
        e.stopPropagation();
    }

    @HostListener('document:click', ['$event.target'])
    documentClickHandler(target) {
        if ( !this.elRef.nativeElement.contains(target) && this.visible ) {
            if ( this.multiple ) {
                this.requestChanges();
            }
            this.blur.emit();
            this.visible = false;
        }
    }


    metricACKeydown(event: any) {
        if ( !this.metricAutoCompleteCntrl.isOpen ) {
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

    ngOnDestroy() {
    }
}
