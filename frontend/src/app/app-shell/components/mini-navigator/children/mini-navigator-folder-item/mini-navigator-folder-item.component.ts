import {
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    Input,
    OnInit,
    Output
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'mini-navigator-folder-item',
    templateUrl: './mini-navigator-folder-item.component.html',
    styleUrls: []
})
export class MiniNavigatorFolderItemComponent implements OnInit {
    @HostBinding('class.mini-navigator-folder-item') private _hostClass = true;
    @HostBinding('class.is-editing') private _isEditingHostClass = false;
    @HostBinding('class.is-selected') private _folderSelected = false;

    /*private _folder: any = {};
    @Input()
    get folder(): any {
        return this._folder;
    }

    set folder(value: any) {
        console.log('>>> SETTING FOLDER ITEM', value);
        this._folder = value;
        if (value.selected) {
            this._folderSelected = value.selected;
        }
    }*/

    @Input() folder: any = {};

    @Input()
    get selected() {
        return this._folderSelected;
    }
    set selected(value) {
        this._folderSelected = value;
    }

    @Input() resourceType: any = ''; // personal<string> | namespace<string>

    private _mode: any = 'display'; // display | new | edit
    @Input()
    get mode() {
        return this._mode;
    }

    set mode(val: string) {
        const prevMode = this._mode;

        if (prevMode !== val && val === 'new') {
            this._isEditingHostClass = !this._isEditingHostClass;
        }
        if (val === 'display') {
            this._isEditingHostClass = false;
        }
        this._mode = val;
    }

    @Output() folderAction: EventEmitter<any> = new EventEmitter();

    FolderForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private hostRef: ElementRef
    ) { }

    ngOnInit() {
    }

    private setupControls() {

        this.FolderForm = this.fb.group({
            fc_FolderName: new FormControl('', [Validators.required])
        });

    }

    gotoFolder(event: any) {
        event.stopPropagation();
        this.folderAction.emit({
            action: 'gotoFolder',
            payload: this.folder
        });
    }

}
