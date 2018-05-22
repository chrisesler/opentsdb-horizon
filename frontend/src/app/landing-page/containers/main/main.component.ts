import { Component, OnInit, HostBinding, ViewChild, TemplateRef } from '@angular/core';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { CdkService } from '../../../core/services/cdk.service';

@Component({
  selector: 'app-landing-page-main',
  templateUrl: './main.component.html',
  styleUrls: []
})
export class LandingPageMainComponent implements OnInit {
  @HostBinding('class.landing-page-main') private _hostClass = true;

  // portal templates
  @ViewChild('landingpageNavbarTmpl') landingpageNavbarTmpl: TemplateRef<any>;

  // portal placeholders
  landingpageNavbarPortal: TemplatePortal;

  constructor(private cdkService: CdkService) {}

  ngOnInit() {
    // setup navbar portal
    this.landingpageNavbarPortal = new TemplatePortal(this.landingpageNavbarTmpl, undefined, {});
    this.cdkService.setNavbarPortal(this.landingpageNavbarPortal);
  }

}
