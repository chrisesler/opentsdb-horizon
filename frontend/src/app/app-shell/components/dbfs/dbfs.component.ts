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
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

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
import { DbfsPanelsState, DbfsPanelsInitialize, DbfsAddPanel, DbfsUpdatePanels } from './state/dbfs-panels.state';
import { DbfsResourcesState, DbfsLoadResources, DbfsLoadSubfolder, DbfsLoadUsersList, DbfsLoadNamespacesList } from './state/dbfs-resources.state';
import { LoggerService } from '../../../core/services/logger.service';
import { MatMenuTrigger } from '@angular/material';

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
    @Select(DbfsState.getLoadedDashboardId) loadedDashboardId$: Observable<any>;
    loadedDashboardId: any = '';

    @Select(DbfsResourcesState.getUser()) user$: Observable<any>;
    user: any = {};

    @Select(DbfsResourcesState.getFolderResources) folders$: Observable<any>;
    folders: any = {};

    @Select(DbfsResourcesState.getFileResources) files$: Observable<any>;
    files: any = {};

    @Select(DbfsResourcesState.getResourcesLoaded) resourcesLoaded$: Observable<any>;

    @Select(DbfsPanelsState.getPanels) panels$: Observable<any[]>;
    panels: any[] = [];

    @Select(DbfsPanelsState.getCurPanel) currentPanelIndex$: Observable<number>;
    // tslint:disable-next-line: no-inferrable-types
    currentPanelIndex: number = 0;

    @Select(DbfsPanelsState.getPanelAction) panelAction$: Observable<any>;

    @Select(DbfsResourcesState.getDynamicLoaded) dynamicLoaded$: Observable<any>;
    usersListLoaded: boolean = false;
    namespacesListLoaded: boolean = false;

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

    /* FORM GROUP STUFF */
    fileForm: FormGroup;
    folderForm: FormGroup;

    // tslint:disable-next-line: no-inferrable-types
    bulkEdit: boolean = false;
    edit: any = {
        mode: '',
        panel: '',
        id: ''
    };

    foldersToRemove: any[] = [];

    menuOpened: any = -1;

    folderMenuTrigger: any;

    constructor(
        private store: Store,
        private interCom: IntercomService,
        private router: Router,
        private utils: UtilsService,
        private logger: LoggerService,
        private fb: FormBuilder,
        @Inject('WINDOW') private window: any
    ) { }

    ngOnInit() {
        this.folderForm = this.fb.group({
            fc_FolderName: new FormControl('', [Validators.required])
        });

        const self = this;

        this.store.dispatch(new DbfsLoadResources());

        this.subscription.add(this.loadedDashboardId$.subscribe( id => {
            this.loadedDashboardId = id;
        }));

        this.subscription.add(this.user$.subscribe( user => {
            this.user = user;
        }));

        this.subscription.add(this.folders$.subscribe( folders => {
            this.folders = folders;
            this.logger.log('FOLDERS RECEIVED', this.folders);
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
            this.resetForms(); // reset forms if you switch panels
        }));

        this.subscription.add(this.currentPanelIndex$.subscribe( idx => {
            this.currentPanelIndex = idx;
        }));

        this.subscription.add(this.dynamicLoaded$.subscribe( loaded => {
            this.usersListLoaded = loaded.users;
            this.namespacesListLoaded = loaded.namespaces;
        }));

        this.subscription.add(this.panelAction$.subscribe( action => {
            // console.log('PANEL ACTION', action);
            switch (action.method) {
                case 'goNextPanel':
                    setTimeout(function() {
                        self.navPanel.goNext();
                    }, 200);
                    break;
                default:
                    break;
            }
        }));

        // INTERCOM SUBSCRIPTION
        this.subscription.add(this.interCom.requestListen().subscribe((message: IMessage) => {
            // intercom stuff
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    /* UTILS */
    getPanelContext(path: string, panelIndex: number) {
        /*const panel = this.store.selectSnapshot<any>(DbfsResourcesState.getFolderResource(path));

        const data = {
            panelIndex,
            panel
        };
        this.logger.log('getPanelContext', { path, panelIndex, data });
        return data;*/
        const panel = this.store.select(DbfsResourcesState.getFolderResource(path));
        return panel;
    }

    getDynamicPanelContext(path: string, panelIndex: number) {
        /*switch (path) {
            case ':list-users:':
                if (!this.usersListLoaded) {
                    this.store.dispatch(
                        new DbfsLoadUsersList()
                    );
                }
                break;
            case ':list-namespaces:':
                if (!this.namespacesListLoaded) {
                    this.store.dispatch(
                        new DbfsLoadNamespacesList()
                    );
                }
                break;
            default:
                break;
        }*/

        const panel = this.store.select(DbfsResourcesState.getDynamicFolderResource(path));
        return panel;
    }

    getPanelResources(path: string) {
        
    }

    getResource(path: string, type?: string) {
        const resource = this.store.selectSnapshot<any>(DbfsResourcesState.getFolderResource(path));
        return resource;
    }

    normalizeFolderResource(path) {
        const folder = this.folders[path];
    }

    resetForms() {
        this.logger.log('RESET FORMS');
        this.foldersToRemove = [];
        this.bulkEdit = false;
        this.resetEdit();
    }

    resetEdit() {
        this.edit = {
            mode: '',
            panel: '',
            id: ''
        };
        this.folderForm.reset({fc_FolderName: ''});
    }

    /* behaviors */

    closeDrawer() {
        this.logger.log('CLOSE DRAWER');
        const data: any = {
            closeNavigator: true
        };
        if (this.activeMediaQuery === 'xs') {
            data.resetForMobile = true;
        }
        this.toggleDrawer.emit(data);
    }

    // DYNAMIC FOLDER BEHAVIOR

    loadAllNamespacePanel() {
        this.logger.log('LOAD ALL NAMESPACES PANEL');
        if (!this.namespacesListLoaded) {
            this.store.dispatch(
                new DbfsLoadNamespacesList()
            );
        }
        this.gotoFolder(':list-namespaces:');
    }

    // FOLDER BEHAVIORS
    editFolders() {
        this.logger.log('BULK EDIT FOLDERS');
        this.bulkEdit = true;
    }

    doneEditFolders() {
        this.logger.log('BULK EDIT DONE');
    }

    createFolder() {
        this.logger.log('CREATE FOLDER');
        this.folderForm.reset({fc_FolderName: ''});
        this.edit = {
            mode: 'create',
            panel: this.currentPanelIndex,
            id: ''
        };
    }

    cancelCreateFolder() {
        this.logger.log('CANCEL CREATE FOLDER');
        this.resetEdit();
    }

    removeFolders() {
        this.logger.log('REMOVE FOLDERS');
    }

    clickFolderMore(trigger: MatMenuTrigger, event: any) {
        this.logger.log('CLICK FOLDER MORE', {trigger, event});
        event.stopPropagation();

    }

    folderMenuAction(action: string, folder: any, event?: any) {
        this.logger.log('FOLDER MENU ACTION', {action, event});
    }

    folderInputSave(folder?: any) {
        if (this.folderForm.invalid) {
            return;
        }
        if (this.edit.mode === 'new') {
            // console.log('SAVE NEW', this.FolderForm.controls.fc_FolderName.value);
            /*this.folderAction.emit({
                action: 'createFolder',
                name: this.FolderForm.controls.fc_FolderName.value
            });*/
        }

        if (this.edit.mode === 'edit') {
            // console.log('SAVE EDIT', this.FolderForm.controls.fc_FolderName.value);
            /*this.nameEdit = false;
            this.folderAction.emit({
                action: 'editFolder',
                name: this.FolderForm.controls.fc_FolderName.value
            });*/
        }
    }

    // FILE (Dashboard) BEHAVIORS

    createDashboard() {
        this.logger.log('CREATE DASHBOARD');
    }

    navigateToDashboard(path: string) {
        this.logger.log('NAVIGATE TO DASHBOARD', { path });
    }

    // PANEL NAVIGATION BEHAVIORS

    navtoSpecificPanel(idx: number, fromIdx: number) {
        // console.log('NAV TO SPECIFIC FOLDER [GO BACK X]');
        // const idx = this.panels.indexOf(folder);
        /*if (idx === 0 && this.panels.length === 2) {
            this.navPanel.goBack( () => {
                this.panels.splice(idx, 1);
            });
        } else {*/
            this.currentPanelIndex = idx;
            const _panels = JSON.parse(JSON.stringify(this.panels));
            _panels.splice((idx + 1), (fromIdx - idx) - 1);
            this.navPanel.shiftTo(idx, idx + 1, () => {
                _panels.splice(idx + 1);
                this.store.dispatch(
                    new DbfsUpdatePanels({
                        panels: _panels,
                        currentPanelIndex: this.currentPanelIndex
                    })
                );
            });
        // }
    }


    navtoMasterPanel() {
        this.logger.log('NAV TO MASTER PANEL');
        if (this.currentPanelIndex > 0) {
            this.navtoSpecificPanel(0, this.currentPanelIndex);
        }
    }

    gotoFolder(path: string) {
        if (!this.bulkEdit) {
            this.logger.log('GOTO FOLDER', { path });
            const folder = this.store.selectSnapshot<any>(DbfsResourcesState.getFolderResource(path));
            const panel = <any>{
                folderResource: folder.fullPath
            };

            if (folder.synthetic) {
                panel.synthetic = folder.synthetic;
            }

            if (folder.root) {
                panel.root = folder.root;
            }

            if (folder.ownerType === 'dynamic') {
                panel.dynamic = true;
            }

            if (folder.trashFolder) {
                panel.trashFolder = true;
            }

            // add panel
            this.store.dispatch(
                new DbfsAddPanel({
                    panel,
                    panelAction: 'goNextPanel'
                })
            );

            if (!folder.loaded && !folder.synthetic) {
                this.store.dispatch(
                    new DbfsLoadSubfolder(folder.fullPath)
                );
            }
        }
    }

}
