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
    selector: 'mini-navigator-folders',
    templateUrl: './mini-navigator-folders.component.html',
    styleUrls: []
})
export class MiniNavigatorFoldersComponent implements OnInit {

    @HostBinding('class.mini-navigator-folders') private _hostClass = true;

    // tslint:disable-next-line:no-inferrable-types
    @Input() masterPanel: boolean = false;
    @Input() resourceType: any = ''; // personal<string> | namespace<string>
    @Input() folders: any[] = [];

    @Output() folderAction: EventEmitter<any> = new EventEmitter();

    editMode: any = 'none'; // display | create

    constructor() { }

    ngOnInit() {
    }

    folderItemAction(event: any) {
        // console.log('FOLDER ACTION [folders]', event);

        this.folderAction.emit(event);
    }

    selectFolderItem(folder: any, event: any) {
        event.stopPropagation();
        // console.log('SELECT FOLDER [folders]', folder);
        this.folderItemAction({
            action: 'selectFolder',
            payload: folder
        });
    }


}
