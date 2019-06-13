import {
    Component,
    OnInit,
    ElementRef,
    HostBinding,
    Input,
    Output,
    EventEmitter
} from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import {
    MatInput,
    MatMenuTrigger
} from '@angular/material';

import { Subscription } from 'rxjs';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'dbfs-folder',
    templateUrl: './dbfs-folder.component.html',
    styleUrls: ['./dbfs-folder.component.scss']
})
export class DbfsFolderComponent implements OnInit {

    @HostBinding('class.dnav-folder-item') private _hostClass = true;

    constructor(
        private fb: FormBuilder,
        private hostRef: ElementRef,
    ) { }

    ngOnInit() {
    }

}
