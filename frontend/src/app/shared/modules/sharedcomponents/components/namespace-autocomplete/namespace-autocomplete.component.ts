import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';

import { HttpService } from '../../../../../core/http/http.service';

@Component({
  selector: 'namespace-autocomplete',
  templateUrl: './namespace-autocomplete.component.html',
  styleUrls: ['./namespace-autocomplete.component.scss']
})
export class NamespaceAutocompleteComponent implements OnInit {

    @Input() value = '';
    @Output() nschange = new EventEmitter();
    filteredNamespaceOptions: Observable<string[]>;
    namespaceControl: FormControl;
    selectedNamespace;

    constructor( private httpService: HttpService ) { }

    ngOnInit() {
        this.namespaceControl = new FormControl(this.value);
        this.filteredNamespaceOptions = this.namespaceControl.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                switchMap(value => this.httpService.getNamespaces({ searchPattern: value}))
            );
    }

    namespaceKeydown(event: any) {
        this.selectedNamespace = this.namespaceControl.value;
        this.nschange.emit( this.selectedNamespace );
    }

    /**
     * * Event fired when an autocomplete option is selected
     */
    namespaceOptionSelected(event: any) {
        this.selectedNamespace = event.option.value;
        this.nschange.emit( this.selectedNamespace );
    }

}
