import {
    Component, OnInit, HostBinding, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges
} from '@angular/core';

import {
    MatDialog, MatDialogConfig, MatDialogRef, DialogPosition
} from '@angular/material';

import { SearchAllDialogComponent } from '../search-all-dialog/search-all-dialog.component';

import { Subscription } from 'rxjs';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'navbar-search-toggle',
    templateUrl: './navbar-search-toggle.component.html',
    styleUrls: []
})
export class NavbarSearchToggleComponent implements OnInit {

    @HostBinding('class.navbar-search-toggle') private _hostClass = true;

    /** Dialogs */
    // search metrics dialog
    searchAllDialog: MatDialogRef<SearchAllDialogComponent> | null;
    searchAllDialogSub: Subscription;

    constructor(
        public dialog: MatDialog
    ) { }

    ngOnInit() {
    }

    toggleSearchMode() {
        // search mode initiation of modal
        // console.log('EVT: toggleSearchMode');
        this.openSearchAllDialog();
    }

    openSearchAllDialog() {
        // do something
        const dialogConf: MatDialogConfig = new MatDialogConfig();
        dialogConf.width = '100%';
        dialogConf.maxWidth = '100%';
        dialogConf.height = 'calc(100% - 48px)';
        dialogConf.backdropClass = 'search-all-dialog-backdrop';
        dialogConf.panelClass = 'search-all-dialog-panel';
        dialogConf.position = <DialogPosition>{
            top: '48px',
            bottom: '0px',
            left: '0px',
            right: '0px'
        };
        dialogConf.data = { };

        this.searchAllDialog = this.dialog.open(SearchAllDialogComponent, dialogConf);
        this.searchAllDialog.updatePosition({top: '48px'});

        // getting data passing out from dialog
        this.searchAllDialog.afterClosed().subscribe((dialog_out: any) => {
            // console.log('return', dialog_out);
        });
    }

}
