import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    HostBinding
} from '@angular/core';

import { FormBuilder, FormGroup, FormControl } from '@angular/forms';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dnav-folder-item',
    templateUrl: './dnav-folder-item.component.html',
    styleUrls: []
})
export class DnavFolderItemComponent implements OnInit {

    @HostBinding('class.dnav-folder-item') private _hostClass = true;

    @Input() folder: any = {};

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
        this._mode = val;
    }

    @Output() folderAction: EventEmitter<any> = new EventEmitter();

    FolderForm: FormGroup;

    constructor(
        private fb: FormBuilder
    ) { }

    ngOnInit() {
        if (this.mode === 'new') {
            this.setupControls('new');
        }
    }

    /** privates */

    private setupControls(mode) {
        if (mode === 'new') {
            this.FolderForm = this.fb.group({
                fc_FolderName: ''
            });
        }

        if (mode === 'edit') {
            this.FolderForm = this.fb.group({
                fc_FolderName: this.folder.name,
                fc_FolderChecked: false
            });
        }
    }

    /** events */

    inputSave() {
        if (this.mode === 'new') {
            console.log('SAVE NEW', this.FolderForm.controls.fc_FolderName.value);
            this.folderAction.emit({
                action: 'createFolder',
                name: this.FolderForm.controls.fc_FolderName.value
            });
        }

        if (this.mode === 'edit') {
            console.log('SAVE EDIT', this.FolderForm.controls.fc_FolderName.value);
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

}
