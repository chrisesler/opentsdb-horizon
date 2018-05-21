import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Portal, TemplatePortal } from '@angular/cdk/portal';

@Injectable({
    providedIn: 'root'
})
export class CdkService {

    private dashboardSettingsPortalSubject: BehaviorSubject<TemplatePortal<any>>;
    private editViewModeSubject: BehaviorSubject<TemplatePortal<any>>;
    private addNewDashboardPanelSubject: BehaviorSubject<TemplatePortal<any>>;

    // navbar portal setup
    get dashboardSettingsPortal$() {
        return this.dashboardSettingsPortalSubject.asObservable();
    }

    setDashboardSettingsPortal(portal: TemplatePortal<any>) {
        this.dashboardSettingsPortalSubject.next(portal);
    }

    // edit view mode
    get editViewModePortal$() {
        return this.editViewModeSubject.asObservable();
    }

    setEditViewModePortal(portal: TemplatePortal<any>) {
        this.editViewModeSubject.next(portal);
    }

    // add new dashboard panel subject
    get addNewDashboardPanelPortal$() {
        return this.addNewDashboardPanelSubject.asObservable();
    }

    setAddNewDashboardPanelPortal(portal: TemplatePortal<any>) {
        this.addNewDashboardPanelSubject.next(portal);
    }

    // constructor
    constructor() {
        this.dashboardSettingsPortalSubject = new BehaviorSubject(null);
        this.editViewModeSubject = new BehaviorSubject(null);
        this.addNewDashboardPanelSubject = new BehaviorSubject(null);
    }
}
