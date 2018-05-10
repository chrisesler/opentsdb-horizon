import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Portal, TemplatePortal } from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root'
})
export class CdkService {
  // navbar portal setup
  get navbarPortal$() {
    return this.navbarPortalSubject.asObservable();
  }

  private navbarPortalSubject: BehaviorSubject<TemplatePortal<any>>;

  setNavbarPortal(portal: TemplatePortal<any>) {
    this.navbarPortalSubject.next(portal);
  }

  // constructor
  constructor() {
    this.navbarPortalSubject = new BehaviorSubject(null);
  }
}
