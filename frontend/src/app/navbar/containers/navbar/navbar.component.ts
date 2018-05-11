import { Component, OnInit, Input, Output, EventEmitter, HostBinding } from '@angular/core';

import { Router } from '@angular/router';

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

  constructor(
    private router: Router,
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
  }

  ngOnInit() { }
}
