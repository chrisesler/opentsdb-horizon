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
  selector: 'inline-filter-editor',
  templateUrl: './inline-filter-editor.component.html',
  styleUrls: ['./inline-filter-editor.component.scss']
})



export class InlineFilterEditorComponent implements OnInit, OnChanges, OnDestroy {
  @HostBinding('class.query-editor') private _hostClass = true;
  @Input() namespace;
  @Input() metrics = [];
  @Input() filters = [];
  @Input() query: any = {   metrics: [] , filters: [], settings: {visual: {visible: true}}};
  @Input() label = '';
  @Input() edit = [];
  @Input() type;
  // @Input() edit = [];
  editNamespace = false;
  // @Input() showTag = false;
  // @Input() namespace = '';
  // @Input() tagsSelected: any = {};
  @Output() filterOutput = new EventEmitter();

  @ViewChild('tagValueSearchInput') tagValueSearchInput: ElementRef;
  @ViewChild('tagSearchInput') tagSearchInput: ElementRef;
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
          this.setTagSearch();
          this.setTagValueSearch();
  }


  deleteFilter(index) {
      this.requestChanges('DeleteQueryFilter', { findex: index });
  }


  setTagSearch() {
      this.tagSearchControl = new FormControl('');
      this.tagSearchControl.valueChanges
      .pipe(
          startWith(''),
          debounceTime(200)
      )
      .subscribe( value => {
          const query: any = { namespace: this.namespace, tags: this.filters, metrics: [] };

          query.search = value ? value : '';

          // filter tags by metrics
          if ( this.metrics ) {
              for ( let i = 0, len = this.metrics.length; i < len; i++ ) {
                  if ( !this.metrics[i].expression ) {
                      query.metrics.push(this.metrics[i].name);
                  } else {
                      const metrics = this.metrics[i].metrics.map(item => item.name.replace(this.namespace + '.',''));
                      query.metrics = query.metrics.concat(metrics);
                  }
              }
              query.metrics = query.metrics.filter((x, i, a) => a.indexOf(x) == i);
          }
              this.message['tagControl'] = {};
              this.httpService.getNamespaceTagKeys(query)
                                                      .pipe(
                                                          // debounceTime(200),
                                                      ).subscribe( res => {
                                                          const selectedKeys = this.filters.map(item => item.tagk);
                                                          res = res.filter(item => selectedKeys.indexOf(item.name) === -1);
                                                          const options = selectedKeys.map(item => { return {name:item};}).concat(res);
                                                          if ( this.loadFirstTagValues && options.length ) {
                                                              this.handlerTagClick(options[0].name);
                                                          }
                                                          this.loadFirstTagValues = false;
                                                          this.tagOptions = options;
                                                      },
                                                      err => {
                                                          this.tagOptions = [];
                                                          const message = err.error.error? err.error.error.message : err.message;
                                                          this.message['tagControl'] = { 'type': 'error', 'message' : message };
                                                      });
          // this.tagSearchInput.nativeElement.focus();
      });
  }

  setTagValueSearch() {
      this.tagValueSearchControl = new FormControl('');

      // need to include switchMap to cancel the previous call
      this.tagValueSearchControl.valueChanges
      .pipe(
          startWith(''),
          debounceTime(200)
      )
      .subscribe( value => {
          const query: any = { namespace: this.namespace, tags: this.filters.filter( item=>item.tagk !== this.selectedTag), metrics: [] };

          query.search = value ? value : '';

          // filter by metrics
          if ( this.metrics ) {
              for ( let i = 0, len = this.metrics.length; i < len; i++ ) {
                  if ( !this.metrics[i].expression ) {
                      query.metrics.push(this.metrics[i].name);
                  } else {
                      const metrics = this.metrics[i].metrics.map(item => item.name.replace(this.namespace + '.',''));
                      query.metrics = query.metrics.concat(metrics);
                  }
              }
              query.metrics = query.metrics.filter((x, i, a) => a.indexOf(x) == i);
          }
          if ( this.selectedTag && this.tagValueTypeControl.value === 'literalor' ) {
              query.tagkey = this.selectedTag;
              this.message['tagValueControl'] = {};
              this.httpService.getTagValuesByNamespace(query)
                              .subscribe(res => {
                                  this.filteredTagValues = res;
                              },
                              err => {
                                  this.filteredTagValues = [];
                                  const message = err.error.error? err.error.error.message : err.message;
                                  this.message['tagValueControl'] = { 'type': 'error', 'message' : message };
                              });
          }
      });
  }

  requestChanges(action, data= {}) {
      this.filterOutput.emit(this.filters);
  }

  triggerQueryChanges() {
      this.requestChanges('QueryChange', {'query': this.query});
  }






  handlerTagClick( tag ) {
      this.selectedTag = tag;
      this.selectedTagIndex = this.getTagIndex(tag);
      this.tagValueTypeControl.setValue('literalor');
      this.tagValueSearchControl.setValue(null);
  }

  removeTagValues(tag) {
      this.filters.splice(this.getTagIndex(tag), 1);
      this.tagSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      this.tagValueSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      this.queryChanges$.next(true);
  }

  getTagIndex ( tag ) {
      const tagIndex = this.filters.findIndex( item => item.tagk === tag );
      return tagIndex;
  }

  getTagValueIndex ( tag, v ) {
      const tagIndex = this.getTagIndex(tag);
      let tagValueIndex = -1;
      if ( tagIndex !== -1 ) {
          tagValueIndex = this.filters[tagIndex].filter.indexOf(v);
      }
      return tagValueIndex;
  }

  addTagValueRegexp() {
      let v = this.tagValueSearchControl.value.trim();
      if ( this.tagValueTypeControl.value === 'regexp' && v ) {
          v = 'regexp(' + v + ')';
          this.updateTagValueSelection(v, 'add');
          this.tagValueSearchControl.setValue(null);
      }
  }

  updateTagValueSelection(v, operation) {
      v = v.trim();
      if ( this.selectedTagIndex === -1  && operation === 'add' ) {
          this.selectedTagIndex = this.filters.length;
          const filter: any = { tagk: this.selectedTag,  filter: []};
          filter.groupBy = this.type === 'LinechartWidgetComponent' ? true : true;
          this.filters[this.selectedTagIndex] = filter;
      }

      if (  operation === 'add') {
          this.filters[this.selectedTagIndex].filter.push(v);
      } else if ( this.selectedTagIndex !== -1 && operation === 'remove' ) {
          const index = this.filters[this.selectedTagIndex].filter.indexOf(v);
          this.filters[this.selectedTagIndex].filter.splice(index, 1);
          if ( !this.filters[this.selectedTagIndex].filter.length ) {
              this.filters.splice(this.selectedTagIndex, 1);
              this.selectedTagIndex = -1;
          }
      }
      this.tagSearchControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      this.queryChanges$.next(true);
  }



  isInfilteredKeys(key) {
      const keys = [];
      for ( let i = 0, len = this.filters.length; i < len; i++  ) {
          keys.push(this.filters[i].tagk );
      }
      return keys.indexOf(key);
  }


  closeEditMode() {
      this.edit = [];
      this.requestChanges('CloseQueryEditMode');
  }

  // handle when clicked on cancel
  cancel(): void {
      this.closeEditMode();
      this.query = this.queryBeforeEdit;
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

