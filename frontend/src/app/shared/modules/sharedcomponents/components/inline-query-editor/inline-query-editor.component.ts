import { Component, OnInit, HostBinding, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';

import { HttpService } from '../../../../../core/http/http.service';

@Component({
  selector: 'inline-query-editor',
  templateUrl: './inline-query-editor.component.html',
  styleUrls: ['./inline-query-editor.component.scss']

})
export class InlineQueryEditorComponent implements OnInit {
    @HostBinding('class.inline-query-editor') private _hostClass = true;
    @Input() query: any;
    nsTagKeys = [];
    tags: any = {};
    namespace;
    namespaceEdit = true;
    showTagControl = true;
    showTagValueControl = false;
    showAddTagBtn = false;
    showTags = false;
    currentTag = '';
    editTagValue = '';
    Object = Object;

    constructor( private httpService: HttpService ) { }

    ngOnInit() {
    }

    setNamespace( namespace ) {
        this.namespace = namespace;
        this.showTagControl = true;
        this.showTags = true;
        this.namespaceEdit = false;

    }

    setTag( tag ) {
        this.tags[tag] = [];
        // new reference needs to be passed to the tag auto complete control
        this.tags = { ...this.tags };
        this.currentTag = tag;
        this.showTagValueControl = true;
        this.showTagControl = false;
    }

    setTagValue(  v , tag ) {
        console.log("settagvalue, tag=", tag, "v=", v, JSON.stringify(this.tags));
        if ( ! this.tags[tag] ) {
            this.tags[tag] = [];
        }
        // we support single value now
        this.tags[tag][0] = v ;
        // new reference needs to be passed to the tag auto complete control
        this.tags = { ...this.tags };

        if ( this.editTagValue === '' ) {
            this.showTagValueControl = false;
            this.showTagControl = true;
        } else {
            this.editTagValue = '';
        }
        console.log("settagvalue", tag, v, JSON.stringify(this.tags));

    }

    showAddTagButton() {
        this.showTagControl = false;
        this.showAddTagBtn = true;
    }

    setEditTagValue( tag , value ) {

        this.editTagValue = tag + ':' + value;
        console.log( " setEditTagValue", this.editTagValue);
    }

    activateTagAutoSuggest() {
        this.showTagControl = true;
    }
}
