import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    HostListener,
    ViewChild,
    ElementRef
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import {
    MatMenuTrigger,
    MatInput
} from '@angular/material';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dnav-dashboard-item',
    templateUrl: './dnav-dashboard-item.component.html',
    styleUrls: []
})
export class DnavDashboardItemComponent implements OnInit {

    @HostBinding('class.dnav-dashboard-item') private _hostClass = true;
    @HostBinding('class.dnav-menu-opened') private _menuOpened = false;
    @HostBinding('class.is-editing') private _isEditingHostClass = false;

    @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

    @Input() dashboard: any = {};
    @Input() resourceType: any = ''; // personal<string> | namespace<string>

    private _mode: any = 'display'; // display | new | edit
    @Input()
    get mode() {
        return this._mode;
    }
    set mode(val: string) {
        const prevMode = this._mode;
        if (prevMode !== val && val === 'edit') {
            this.setupControls('edit');
        }
        if (prevMode !== val && val === 'new') {
            this._isEditingHostClass = !this._isEditingHostClass;
        }
        if (val === 'display') {
            this._isEditingHostClass = false;
            this._nameEdit = false;
        }
        this._mode = val;
    }

    // tslint:disable-next-line:no-inferrable-types
    private _nameEdit: boolean = false;
    get nameEdit() {
        if (this._mode === 'edit') {
            return this._nameEdit;
        }
        return false;
    }

    set nameEdit(val: boolean) {
        if (this._mode === 'edit') {
            this._nameEdit = val;
            this._isEditingHostClass = this._nameEdit;

            if (val === true) {
                setTimeout(function() {
                    // const el = this.hostRef.nativeElement.querySelector('.mat-input-element');
                    // el.focus();
                }.bind(this), 200);
            }
        }
    }

    @Output() dashboardAction: EventEmitter<any> = new EventEmitter();

    DashboardForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private hostRef: ElementRef
    ) { }

    ngOnInit() {
    }

    /** privates */

    private setupControls(mode) {
        // setup formGroup
    }

    get f() {
        return this.DashboardForm.controls;

    }

    /** Input Events */

    /** Menu Events */

    clickMore(event) {
        event.stopPropagation();
        this.menuTrigger.toggleMenu();
    }

    menuState(state: boolean) {
        console.log('MENU STATE', state);
        this._menuOpened = state;
    }

    menuAction(action: string, event?: any) {
        switch (action.toLowerCase()) {
            default:
                break;
        }
    }


    /** Host Events */
    @HostListener('click', ['$event'])
    onclick(event) {
        console.log('HOST CLICK', event);
    }



}
