import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    AfterContentInit,
    ViewChild,
    ElementRef,
    HostBinding,
    HostListener
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, switchMap, skip } from 'rxjs/operators';
import { MatAutocomplete } from '@angular/material';
import { HttpService } from '../../../../../core/http/http.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'namespace-autocomplete',
    templateUrl: './namespace-autocomplete.component.html',
    styleUrls: []
})

export class NamespaceAutocompleteComponent implements OnInit {

    @HostBinding('class.namespace-autocomplete-component') private _hostClass = true;

    @Input() value = '';
    @Input() options: any = {};
    @Output() nschange = new EventEmitter();
    @Output() blur = new EventEmitter();
    @ViewChild('namespaceInput') nsInput: ElementRef;
    @ViewChild('namespaceAuto') nsAutoCompleteCntrl: MatAutocomplete;

    visible = false;
    filteredNamespaceOptions = [];
    namespaces = [];
    namespaceControl: FormControl;
    selectedNamespace;



    constructor(private httpService: HttpService, private elRef: ElementRef) { }

    ngOnInit() {
        let showFullList = true;
        this.namespaceControl = new FormControl(this.value);
        this.namespaceControl.valueChanges
            .pipe(
                debounceTime(100),
            ).subscribe( search => {
                search = search.trim();
                search = search === '' || showFullList ? '.*' : search;
                search = search.replace(/\s+/g, '.*').toLowerCase();
                const regex = new RegExp( search );
                for ( let i = 0; i < this.namespaces.length; i++ ) {
                    this.filteredNamespaceOptions = this.namespaces.filter(d => regex.test(d.toLowerCase()));
                }
                showFullList = false;
            });
        this.httpService.getNamespaces({ search: '' }, this.options.metaSource)
                        .subscribe(res => {
                            this.namespaces = res;
                            this.namespaceControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
                        },
                        err => {
                            this.namespaces = [];
                            this.filteredNamespaceOptions = [];
                        });

        setTimeout(() => {
            // this.nsInput.nativeElement.focus();
            this.visible = true;
        }, 500);
    }


    namespaceKeydown(event: any) {

        const textVal = this.namespaceControl.value;

        // check if the namespace is valid option

        // find index in options
        const checkIdx = this.filteredNamespaceOptions.findIndex(item => textVal.toLowerCase() === item.toLowerCase());

        if (checkIdx >= 0) {
            // set value to the option value (since typed version could be different case)
            this.selectedNamespace = this.filteredNamespaceOptions[checkIdx];
            // emit change
            this.nschange.emit(this.selectedNamespace);
        }
    }

    resetNamespaceList() {
        if ( this.namespaces.length ) {
            this.filteredNamespaceOptions = this.namespaces;
        }
    }

    /**
     * * Event fired when an autocomplete option is selected
     */
    namespaceOptionSelected(event: any) {
        this.selectedNamespace = event.option.value;
        this.nschange.emit(this.selectedNamespace);
    }

    @HostListener('click', ['$event'])
    hostClickHandler(e) {
        e.stopPropagation();
    }

    @HostListener('document:click', ['$event.target'])
    documentClickHandler(target) {
        if (!target.classList.contains('mat-option-text') && this.visible) {
            // console.log('window:click outside', this.elRef, target, this.elRef.nativeElement.contains(target));
            this.namespaceControl.setValue(this.value, {emitEvent: false});
            this.blur.emit('');
        }
    }

}
