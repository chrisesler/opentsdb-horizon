import {
    AfterViewInit,
    Component,
    OnInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    ViewChild,
    ElementRef
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import {
    MatInput,
    MatMenuTrigger
} from '@angular/material';

import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs';

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dnav-folder-item',
    templateUrl: './dnav-folder-item.component.html',
    styleUrls: []
})
export class DnavFolderItemComponent implements OnInit, AfterViewInit, OnDestroy {

    @HostBinding('class.dnav-folder-item') private _hostClass = true;
    @HostBinding('class.dnav-menu-opened') private _menuOpened = false;
    @HostBinding('class.is-editing') private _isEditingHostClass = false;

    @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

    listenSub: Subscription;

    @Input() folder: any = {};
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
                // set timeout so it has time to render
                setTimeout(function () {
                    const el = this.hostRef.nativeElement.querySelector('.mat-input-element');
                    el.focus();
                }.bind(this), 200);
            }
        }
    }

    @Output() folderAction: EventEmitter<any> = new EventEmitter();

    FolderForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private hostRef: ElementRef,
        private interCom: IntercomService
    ) { }

    ngOnInit() {
        if (this.mode === 'new') {
            this.setupControls('new');
        }
    }

    ngAfterViewInit() {
        if (this.mode === 'new') {
            const el = this.hostRef.nativeElement.querySelector('.mat-input-element');
            el.focus();
        }
    }

    ngOnDestroy() {
        if (this.listenSub) {
            this.listenSub.unsubscribe();
        }
    }

    /** privates */

    private setupControls(mode) {
        if (mode === 'new') {
            this.FolderForm = this.fb.group({
                fc_FolderName: new FormControl('', [Validators.required])
            });
        }

        if (mode === 'edit') {
            this.FolderForm = this.fb.group({
                fc_FolderName: new FormControl(this.folder.name, [Validators.required]),
                fc_FolderChecked: false
            });
        }
    }

    // convenience getter for easy access to form fields
    get f() {
        if (this.FolderForm) {
            return this.FolderForm.controls;
        }
        return {};
    }

    /** events */

    inputSave() {
        if (this.FolderForm.invalid) {
            return;
        }
        if (this.mode === 'new') {
            console.log('SAVE NEW', this.FolderForm.controls.fc_FolderName.value);
            this.folderAction.emit({
                action: 'createFolder',
                name: this.FolderForm.controls.fc_FolderName.value
            });
        }

        if (this.mode === 'edit') {
            console.log('SAVE EDIT', this.FolderForm.controls.fc_FolderName.value);
            this.nameEdit = false;
            this.folderAction.emit({
                action: 'editFolder',
                name: this.FolderForm.controls.fc_FolderName.value
            });
        }
    }

    checkboxChange(event) {
        console.log('CHECKBOX CHANGE', event, this.FolderForm.controls.fc_FolderChecked.value);
        this.folderAction.emit({
            action: 'pendingRemoval',
            value: this.FolderForm.controls.fc_FolderChecked.value
        });
    }

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
            case 'editname':
                this.nameEdit = true;
                break;
            default:
                break;
        }
    }
}
