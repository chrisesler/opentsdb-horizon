import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    HostBinding,
    HostListener,
    ViewChild
} from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dnav-folders',
    templateUrl: './dnav-folders.component.html',
    styleUrls: []
})
export class DnavFoldersComponent implements OnInit {

    @HostBinding('class.dnav-folders') private _hostClass = true;

    // tslint:disable-next-line:no-inferrable-types
    @Input() masterPanel: boolean = false;
    @Input() resourceType: any = ''; // personal<string> | namespace<string>
    @Input() folders: any[] = [];

    @Output() folderAction: EventEmitter<any> = new EventEmitter();

    // tslint:disable-next-line:no-inferrable-types
    bulkEdit: boolean = false;
    editMode: any = 'none'; // display | edit | create

    foldersToRemove: any[] = [];
    pendingNameChanges: any[] = [];

    constructor() { }

    ngOnInit() {
    }

    /** Events */

    createFolder() {
        this.editMode = 'create';
    }

    cancelCreate() {
        this.editMode = 'display';
    }

    createFolderAction(event) {
        console.log('EVENT', event);
        switch (event.action) {
            case 'createFolder':
                const newFolder = {
                    name: event.name,
                    icon: 'd-folder',
                    subfolder: [],
                    folders: []
                };
                // send this to API, after success, then push to current array
                // ALSO... need to check for duplicate name
                // after response, and check, then add to front of array
                this.folders.unshift(newFolder);
                this.editMode = 'display';
                break;
            default:
                break;
        }
    }

    // toggles bulk edit
    editFolders() {
        this.bulkEdit = true;
        this.editMode = 'edit';
        this.foldersToRemove = [];
    }

    removeFolders() {
        // SOMEWHERE HERE YOU NEED TO REMOVE WITH API

        // REMOVE FROM UI
        // tslint:disable-next-line:forin
        for ( const i in this.foldersToRemove ) {
            const folder = this.foldersToRemove[i];
            const idx = this.folders.indexOf(folder);
            this.folders.splice(idx, 1);
            delete this.foldersToRemove[i];
        }
    }

    /*cancelEdit() {
        this.bulkEdit = false;
        this.editMode = 'display';
        this.foldersToRemove = [];
    }*/

    doneEdit() {
        // check for changes, then do something

        // then reset
        this.bulkEdit = false;
        this.editMode = 'display';
        this.foldersToRemove = [];
    }

    editFolderAction(folder, event) {
        switch (event.action) {
            case 'pendingRemoval':
                if (event.value === true) {
                    this.foldersToRemove.push(folder);
                }
                if (event.value === false) {
                    const idx = this.foldersToRemove.indexOf(folder);
                    this.foldersToRemove.splice(idx, 1);
                }
                console.log('FOLDERS TO REMOVE', this.foldersToRemove);
                break;
            case 'editFolder':
                // send this to API, after success, then push to current array
                // ALSO... need to check for duplicate name
                // after response, and check, then add to front of array
                folder.name = event.name;
                break;
            default:
                break;
        }
    }

    // navigate to folder
    gotoFolder(folderIdx: number) {
        if (!this.bulkEdit) {
            this.folderAction.emit({
                action: 'navtoPanelFolder',
                resourceType: this.resourceType,
                idx: folderIdx
            });
        }
    }

    /** privates */

    removeFromPendingRemoval(i) {

    }



}
