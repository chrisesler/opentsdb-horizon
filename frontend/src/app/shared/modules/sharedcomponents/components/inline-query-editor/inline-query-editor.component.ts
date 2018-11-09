import { Component, OnInit, OnChanges, HostBinding, Input, Output, SimpleChanges, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';

import { HttpService } from '../../../../../core/http/http.service';

@Component({
  selector: 'inline-query-editor',
  templateUrl: './inline-query-editor.component.html',
  styleUrls: ['./inline-query-editor.component.scss']

})
export class InlineQueryEditorComponent implements OnInit, OnChanges {
    @HostBinding('class.inline-query-editor') private _hostClass = true;
    @Input() query: any = { filters: [] };
    @Input() showTag = false;
    @Input() namespace ='';
    @Output() queryOutput = new EventEmitter();
    nsTagKeys = [];
    tags: any = [];
    namespaceEdit = true;
    showTagControl = false;
    showTagValueControl = false;
    showAddTagBtn = false;
    showTags = false;
    currentTag = '';
    editTagValue = '';
    Object = Object;

    constructor( private httpService: HttpService ) { }

    ngOnInit() {
        // this.showTagControl = this.showTag;
    }

    ngOnChanges( changes: SimpleChanges ) {
        if ( changes.query && changes.query.currentValue ) {
            const query = changes.query.currentValue;
            for ( let i = 0; i < query.filters.length; i++ ) {
                const tag = query.filters[i].tagk;
                // supports only single value now
                this.tags[tag] = [query.filters[i].filter];
            }

            const metric = query.metric ? query.metric : query.metrics[0].metric;
            this.namespace = metric.split('.')[0];
            console.log("query", query, this.namespace);
        }

        if ( changes.namespace && changes.namespace.currentValue) {
            this.setNamespace();
        }
    }

    setNamespace() {
        // this.namespace = namespace;
        this.showTagControl = true;
        this.showTags = true;
    }

    setTag( tag ) {

        this.tags[tag] = [];
        //if ( tag === 'metric' ) {
        //    this.query.metric = '';
        //} else {
            const filter = {
                            type: 'literalor',
                            tagk: tag,
                            filter: '',
                            groupBy: false
                        };
            this.query.filters.push(filter);
        // }

        // new reference needs to be passed to the tag auto complete control
        this.tags = { ...this.tags };
        this.query = { ...this.query };
        this.currentTag = tag;
        //this.setEditTagValue(tag , '');
        this.showTagValueControl = true;
        this.showTagControl = false;
    }

    setTagValue(  v , tag ) {
        console.log("settagvalue, tag=", tag, "v=", v, JSON.stringify(this.query));
        if ( ! this.tags[tag] ) {
            this.tags[tag] = [];
        }

        // we support single value now
        this.tags[tag][0] = v ;

        if ( tag === 'metric') {
            this.query.metric = this.namespace + '.' + v;
        }
        const index = this.query.filters.findIndex( item => item.tagk === tag );
        this.query.filters[index].filter = v;

        // new reference needs to be passed to the tag auto complete control
        this.tags = { ...this.tags };
        this.query = { ...this.query };

        if ( this.editTagValue === '' ) {
            this.showTagValueControl = false;
            this.showTagControl = true;
        } else {
            this.editTagValue = '';
        }
        this.queryOutput.emit(this.query);
        console.log("settagvalue", tag, v, JSON.stringify(this.query));
    }

    showAddTagButton() {
        this.showTagControl = false;
        this.showAddTagBtn = true;
    }

    setTagDefaultValue() {
        this.setTagValue('*', this.currentTag);
        this.showAddTagButton();
    }

    setEditTagValue( tag , value ) {

        this.editTagValue = tag + ':' + value;
        console.log( " setEditTagValue", this.editTagValue);
    }

    activateTagAutoSuggest() {
        this.showTagControl = true;
    }
}
