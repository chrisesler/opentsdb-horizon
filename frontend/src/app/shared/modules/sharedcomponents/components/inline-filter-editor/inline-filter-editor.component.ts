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
  SimpleChanges, HostListener, ChangeDetectorRef
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
  @HostBinding('class.inline-filter-editor') private _hostClass = true;
  @Input() namespace;
  @Input() metrics = [];
  @Input() filters = [];

  @Output() filterOutput = new EventEmitter();
  @Output() blur = new EventEmitter();

  @ViewChild('tagValueSearchInput') tagValueSearchInput: ElementRef;
  @ViewChild('tagSearchInput') tagSearchInput: ElementRef;

  queryBeforeEdit: any;
  tagOptions = [];
  filteredTagValues = [];
  selectedTagIndex = -1;
  selectedTag = '';
  loadFirstTagValues = false;
  tagValueTypeControl = new FormControl('literalor');
  tagSearchControl: FormControl;
  tagValueSearchControl: FormControl;
  message:any = { 'tagControl' : { message: ''}, 'tagValueControl' : { message: '' }};
  queryChanges$: BehaviorSubject<boolean>;
  queryChangeSub: Subscription;
  tagKeySub: Subscription;
  tagValueSub: Subscription;

  visible = false;
  constructor(
      private elRef: ElementRef,
      private renderer: Renderer,
      private httpService: HttpService,
      private fb: FormBuilder,
      private utils: UtilsService,
      private cdRef: ChangeDetectorRef ) {

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

    if ( changes.namespace && changes.namespace.currentValue || changes.metrics && changes.metrics.currentValue ) {
            this.initFormControls();
    }
}

  initFormControls() {
          this.setTagSearch();
          this.setTagValueSearch();
  }


  deleteFilter(index) {
      this.requestChanges();
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
                  }
              }
              query.metrics = query.metrics.filter((x, i, a) => a.indexOf(x) == i);
          }
            this.message['tagControl'] = {};
            if (  this.tagKeySub ) {
                this.tagKeySub.unsubscribe();
            }
            this.tagKeySub = this.httpService.getNamespaceTagKeys(query)
                                                      .subscribe( res => {
                                                          const selectedKeys = this.filters.map(item => item.tagk);
                                                          res = res.filter(item => selectedKeys.indexOf(item.name) === -1);
                                                          const options = selectedKeys.map(item => { return {name:item};}).concat(res);
                                                          if ( this.loadFirstTagValues && options.length ) {
                                                              this.handlerTagClick(options[0].name);
                                                          }
                                                          this.loadFirstTagValues = false;
                                                          this.tagOptions = options;
                                                          this.cdRef.detectChanges();
                                                      },
                                                      err => {
                                                          this.tagOptions = [];
                                                          const message = err.error.error? err.error.error.message : err.message;
                                                          this.message['tagControl'] = { 'type': 'error', 'message' : message };
                                                          this.cdRef.detectChanges();
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
                  }
              }
              query.metrics = query.metrics.filter((x, i, a) => a.indexOf(x) == i);
          }
          if ( this.selectedTag && this.tagValueTypeControl.value === 'literalor' ) {
              query.tagkey = this.selectedTag;
              this.message['tagValueControl'] = {};
            if (  this.tagValueSub ) {
                this.tagValueSub.unsubscribe();
            }
            this.tagValueSub = this.httpService.getTagValuesByNamespace(query)
                                                .subscribe(res => {
                                                    this.filteredTagValues = res;
                                                    this.cdRef.detectChanges();
                                                },
                                                err => {
                                                    this.filteredTagValues = [];
                                                    const message = err.error.error? err.error.error.message : err.message;
                                                    this.message['tagValueControl'] = { 'type': 'error', 'message' : message };
                                                    this.cdRef.detectChanges();
                                                });
          }
      });
  }

  requestChanges() {
      this.filterOutput.emit(this.filters);
  }

  triggerQueryChanges() {
      this.requestChanges();
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
          filter.groupBy = false;
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


  ngOnDestroy() {
      this.queryChangeSub.unsubscribe();
      if ( this.tagKeySub ) {
        this.tagKeySub.unsubscribe();
      }
      if ( this.tagValueSub ) {
        this.tagValueSub.unsubscribe();
      }
  }

  @HostListener('click', ['$event'])
    hostClickHandler(e) {
        e.stopPropagation();
    }

    @HostListener('document:click', ['$event.target'])
    documentClickHandler(target) {
        if ( !this.elRef.nativeElement.contains(target) && this.visible ) {
            this.blur.emit();
            this.visible = false;

        } else if ( ! this.visible ) {
            this.visible = true;
        }
    }
}

