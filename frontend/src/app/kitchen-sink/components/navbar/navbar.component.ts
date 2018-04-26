import { Component, OnInit, Input, Output, EventEmitter, HostBinding } from '@angular/core';

import { Router } from '@angular/router';


@Component({
  selector: 'ks-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class KSNavbarComponent implements OnInit {

  @HostBinding('class.app-navbar') hostClass = true;
  @HostBinding('class.mat-elevation-z6') mat = true;

  @Input() theme: string;
  @Output() themeChange = new EventEmitter<string>();

  routeLinks: any[];
  activeLinkIndex = -1;

  constructor(private router: Router) {
    this.routeLinks = [
      {
        label: 'Kitchen Sink',
        link: 'ks',
        index: 0
      }, {
        label: 'Dashboard',
        link: 'dashboard',
        index: 1
      }
    ];
  }

  ngOnInit() {
    this.router.events.subscribe((res) => {
      this.activeLinkIndex = this.routeLinks.indexOf(this.routeLinks.find(tab => tab.link === '.' + this.router.url));
    });
  }

  selectTheme(theme: string) {
      this.themeChange.emit(theme);
    }

}
