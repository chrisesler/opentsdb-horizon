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
  SimpleChanges
} from '@angular/core';
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

export class MetricAutocompleteComponent implements OnInit, OnChanges, OnDestroy {
  @HostBinding('class.query-editor') private _hostClass = true;
  @Input() namespace ='';
  @Input() filters = [];
  @Input() metrics = [];
  @Input() type;
  @Input() label = '';
  @Input() edit = [];
  // @Input() edit = [];
  editNamespace = false;
  // @Input() showTag = false;
  // @Input() namespace = '';
  // @Input() tagsSelected: any = {};
  @Output() metricOutput = new EventEmitter();

  @ViewChild('metricSearchInput') metricSearchInput: ElementRef;

  queryBeforeEdit: any;
  tagOptions = [];
  filteredTagOptions: Observable<any>;
  filteredTagValues = [];
  metricOptions = [];
  selectedTagIndex = -1;
  selectedTag = '';
  loadFirstTagValues = false;
  tagValueTypeControl = new FormControl('literalor');
  metricSearchControl: FormControl;
  tagSearchControl: FormControl;
  tagValueSearchControl: FormControl;
  message:any = { 'tagControl' : { message: ''}, 'tagValueControl' : { message: '' }, 'metricSearchControl': { message : ''} };
  Object = Object;

  metricSelectedTabIndex = 0;
  editExpressionId = 0;
  isEditExpression = false;
  aliases = [];
   /** Form Group */
   expressionForm: FormGroup;

   // subscriptions
   expressionForm_Sub: Subscription;

  // form values
  expressionName: string;
  expressionValue: string;

  formControlInitiated = false;

  queryChanges$: BehaviorSubject<boolean>;
  queryChangeSub: Subscription;

  constructor(
      private elRef: ElementRef,
      private renderer: Renderer,
      private httpService: HttpService,
      private fb: FormBuilder,
      private utils: UtilsService ) {

      }

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

  ngOnChanges( changes: SimpleChanges) {
      if ( changes.namespace && changes.namespace.currentValue ) {
        this.initFormControls();
      }
  }

  initFormControls() {
          this.setMetricSearch();
  }

  setMetricSearch() {
      this.metricSearchControl = new FormControl();
      // need to include switchMap to cancel the previous call
      this.metricSearchControl.valueChanges
      .pipe(
          startWith(''),
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

  requestChanges() {

      this.metricOutput.emit(this.metrics);
  }

  triggerQueryChanges() {
      this.requestChanges();
  }

  updateMetricSelection(metric, operation) {
      metric = metric.trim();
      const index = this.getMetricIndex(metric);
      if ( index === -1  && operation === 'add') {
          const id = this.utils.generateId();
          const oMetric = {
                              id: id,
                              name: metric,
                              filters: [],
                              settings: {
                                  visual: {
                                      visible: this.type === 'TopnWidgetComponent' ? false : true,
                                      color: 'auto',
                                      aggregator: this.type === 'LinechartWidgetComponent' ? [] : ['avg'],
                                      label: ''}}
                          };
          this.metrics.push(oMetric);
      } else if ( index !== -1 && operation === 'remove' ) {
          this.metrics.splice(index, 1);
      }
      this.queryChanges$.next(true);
  }
  removeMetricById(mid) {
      const index = this.metrics.findIndex( d => d.id === mid );
      if ( index !== -1 ) {
          this.metrics.splice(index, 1);
      }
      this.queryChanges$.next(true);
  }

  setMetricTagAggregator(id, value) {
      const index  = this.metrics.findIndex( item => item.id === id );
      this.metrics[index].tagAggregator = value;
      this.queryChanges$.next(true);
  }

  getMetricIndex(metric) {
      const index  = this.metrics.findIndex( item => item.name === metric );
      return index;
  }





  closeEditMode() {
      this.edit = [];
      this.requestChanges();
  }

  // handle when clicked on cancel
  cancel(): void {
      this.closeEditMode();
      // this.query = this.queryBeforeEdit;
      this.triggerQueryChanges();
  }

  // handle when clicked on apply
  apply(): any {
      this.closeEditMode();
  }

  ngOnDestroy() {
      // this.expressionForm_Sub.unsubscribe();
      this.queryChangeSub.unsubscribe();
  }
}
