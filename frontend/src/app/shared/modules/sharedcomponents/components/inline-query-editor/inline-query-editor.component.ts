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
    showTagButton = true;
    showTags = false;
    Object = Object;

    constructor( private httpService: HttpService ) { }

    ngOnInit() {
    }

    setNamespace( namespace ) {
        console.log(namespace, "setNamespace");
        this.namespace = namespace;
        this.showTagButton = true;
        this.showTags = true;
        this.namespaceEdit = false;
    }

    setTag( tag ) {
        this.tags[tag] = [];
        // new reference needs to be passed to the tag auto complete control
        this.tags = { ...this.tags };
    }
}
