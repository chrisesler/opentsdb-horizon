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

import { IntercomService, IMessage } from '../../../../../core/services/intercom.service';

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

    constructor(
        private interCom: IntercomService
    ) { }

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
        // console.log('EVENT', event);
        switch (event.action) {
            case 'createFolder':
                /*const newFolder = {
                    name: event.name,
                    icon: 'd-folder',
                    subfolder: [],
                    files: []
                };*/
                // send this to API, after success, then push to current array
                // ALSO... need to check for duplicate name
                // after response, and check, then add to front of array
                // this.folders.unshift(newFolder);
                this.folderAction.emit({
                    action: 'createFolder',
                    data: {
                        name: event.name
                    }
                });
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
            /*const idx = this.folders.indexOf(folder);
            this.folders.splice(idx, 1);
            delete this.foldersToRemove[i];*/

            // TODO: We need a batch remove... until then, we just do a loop
            this.folderAction.emit({
                action: 'deleteFolder',
                data: {
                    path: folder.path
                }
            });
        }

        if (this.foldersToRemove.length === this.folders.length) {
            this.doneEdit();
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
                // console.log('FOLDERS TO REMOVE', this.foldersToRemove);
                break;
            case 'editFolder':
                // send this to API, after success, then push to current array
                // ALSO... need to check for duplicate name
                // after response, and check, then add to front of array
                folder.name = event.name;
                this.folderAction.emit({
                    action: 'editFolder',
                    data: {
                        name: event.name,
                        id: folder.id,
                        path: folder.path
                    }
                });
                break;
            case 'deleteFolder':
                this.folderAction.emit({
                    action: 'deleteFolder',
                    data: {
                        path: folder.path
                    }
                });
                break;
            case 'moveFolder':
                this.folderAction.emit({
                    action: 'moveFolder',
                    data: {
                        sourcePath: folder.path,
                        destinationPath: event.destinationPath
                    }
                });
                break;
            default:
                this.folderAction.emit({
                    ...event,
                    folder
                });
                break;
        }
    }

    // navigate to folder
    // gotoFolder(folderIdx: number) {
    gotoFolder(folder: any) {
        if (!this.bulkEdit) {
            this.folderAction.emit({
                action: 'navtoPanelFolder',
                resourceType: folder.resourceType,
                // idx: folderIdx
                path: folder.path
            });
        }
    }

    /** privates */

    removeFromPendingRemoval(i) {

    }



}
