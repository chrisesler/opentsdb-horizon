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
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';
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
    @Output() nschange = new EventEmitter();
    @Output() blur = new EventEmitter();
    @ViewChild('namespaceInput') nsInput: ElementRef;
    @ViewChild('namespaceAuto') nsAutoCompleteCntrl: MatAutocomplete;

    visible = false;
    filteredNamespaceOptions: Observable<string[]>;
    namespaceControl: FormControl;
    selectedNamespace;



    constructor(private httpService: HttpService, private elRef: ElementRef) { }

    ngOnInit() {
        this.namespaceControl = new FormControl(this.value);
        this.filteredNamespaceOptions = this.namespaceControl.valueChanges
            .pipe(
                startWith(''),
                debounceTime(300),
                switchMap(value => this.httpService.getNamespaces({ search: value }))
            );
        setTimeout(() => {
            // this.nsInput.nativeElement.focus();
            this.visible = true;
        }, 500);
    }


    namespaceKeydown(event: any) {
        if (!this.nsAutoCompleteCntrl.isOpen) {
            this.selectedNamespace = this.namespaceControl.value;
            console.log('selectedns', this.selectedNamespace, event);
            this.nschange.emit(this.selectedNamespace);
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
            this.blur.emit('');
        }
    }

}
