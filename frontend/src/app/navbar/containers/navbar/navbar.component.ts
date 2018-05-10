import { Component, OnInit, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { Portal } from '@angular/cdk/portal';

import { Router } from '@angular/router';

import { IntercomService, IMessage } from '../../../dashboard/services/intercom.service';
import { Subscription } from 'rxjs/Subscription';

import { CdkService } from '../../../core/services/cdk.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  @HostBinding('class.app-navbar') private _hostClass = true;

  @Input() theme: string;
  @Output() themeChange = new EventEmitter<string>();

  routeLinks: any[];
  activeLinkIndex = -1;

  viewEditMode = false;

  private listenSub: Subscription;

  navbarPortal: Portal<any>;

  constructor(
    private router: Router,
    private interCom: IntercomService,
    public cdkService: CdkService
  ) {
    this.routeLinks = [
      /*{
        label: 'Kitchen Sink',
        link: 'ks'
      }, */
      {
        label: 'Dashboard',
        link: 'dashboard'
      }
    ];

    this.listenSub = this.interCom.requestListen().subscribe((message: IMessage) => {
      console.log('NAVBAR listen to: ', JSON.stringify(message));
      if (message.action === 'viewEditMode') {
        this.viewEditMode = message.payload;
      }
    });
  }

  ngOnInit() {
    this.router.events.subscribe((res) => {
      this.activeLinkIndex = this.routeLinks.indexOf(this.routeLinks.find(tab => tab.link === '.' + this.router.url));
    });
  }



}
