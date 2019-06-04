import {
    Component,
    EventEmitter,
    HostBinding,
    Input,
    Inject,
    OnInit,
    OnDestroy,
    Output,
    ViewChild
} from '@angular/core';

import { Router } from '@angular/router';

import { Observable, Subscription } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { NavigatorPanelComponent } from '../navigator-panel/navigator-panel.component';

import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { UtilsService } from '../../../core/services/utils.service';

import {
    Select,
    Store,
    StateContext
} from '@ngxs/store';

import { DbfsState } from './state/dbfs.state';
import { DbfsPanelsState, DbfsPanelsInitialize } from './state/dbfs-panels.state';
import { DbfsResourcesState, DbfsLoadResources } from './state/dbfs-resources.state';

@Component({
// tslint:disable-next-line: component-selector
    selector: 'dbfs',
    templateUrl: './dbfs.component.html',
    styleUrls: ['./dbfs.component.scss']
})
export class DbfsComponent implements OnInit, OnDestroy {

    @HostBinding('class.dashboard-navigator') private _hostClass = true;

    // Subscriptions
    private subscription: Subscription = new Subscription();

    // State
    @Select(DbfsResourcesState.getUser) user$: Observable<any>;
    user: any = {};

    @Select(DbfsResourcesState.getFolderResources) folders$: Observable<any>;
    folders: any = {};

    @Select(DbfsResourcesState.getFileResources) files$: Observable<any>;
    files: any = {};

    @Select(DbfsResourcesState.getResourcesLoaded) resourcesLoaded$: Observable<any>;

    @Select(DbfsPanelsState.getPanels) panels$: Observable<any[]>;
    panels: any[] = [];

    // VIEW CHILDREN
    @ViewChild(NavigatorPanelComponent) private navPanel: NavigatorPanelComponent;

    // Inputs
    // tslint:disable-next-line:no-inferrable-types
    @Input() activeNavSection: string = '';
    @Input() drawerMode: any = 'over';

    // tslint:disable-next-line:no-inferrable-types
    @Input() activeMediaQuery: string = '';

    // Outputs
    @Output() toggleDrawer: EventEmitter<any> = new EventEmitter();

    constructor(
        private store: Store,
        private interCom: IntercomService,
        private router: Router,
        private utils: UtilsService,
        @Inject('WINDOW') private window: any
    ) { }

    ngOnInit() {
        this.store.dispatch(new DbfsLoadResources());

        this.subscription.add(this.user$.subscribe( user => {
            this.user = user;
        }));

        this.subscription.add(this.folders$.subscribe( folders => {
            this.folders = folders;
        }));

        this.subscription.add(this.files$.subscribe( files => {
            this.files = files;
        }));

        this.subscription.add(this.resourcesLoaded$.subscribe( loaded => {
            if (loaded === true) {
                this.store.dispatch(new DbfsPanelsInitialize());
            }
        }));

        this.subscription.add(this.panels$.subscribe( panels => {
            this.panels = panels;
        }));

        // INTERCOM SUBSCRIPTION
        this.subscription.add(this.interCom.requestListen().subscribe((message: IMessage) => {
            // intercom stuff
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

}
