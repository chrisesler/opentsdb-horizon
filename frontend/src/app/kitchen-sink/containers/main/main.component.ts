import { Component, OnInit, HostBinding, ViewChild, TemplateRef } from '@angular/core';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { CdkService } from '../../../core/services/cdk.service';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'ks-main',
    templateUrl: './main.component.html',
    styleUrls: []
})
export class KSMainComponent implements OnInit {

    @HostBinding('class.ks-main') private hostClass = true;

    // portal templates
    @ViewChild('kitchensinkNavbarTmpl') kitchensinkNavbarTmpl: TemplateRef<any>;

    // portal placeholders
    kitchensinkNavbarPortal: TemplatePortal;

    sideNavSections: Array<object> = [
        {
            label: 'Panel 1',
            links: [
                {
                    label: 'link 1 A',
                    link: '/ks'
                },
                {
                    label: 'link 1 B',
                    link: '/ks'
                },
                {
                    label: 'link 1 C',
                    link: '/ks'
                },
                {
                    label: 'link 1 D',
                    link: '/ks'
                }
            ]
        },
        {
            label: 'Panel 2',
            links: [
                {
                    label: 'link 2 A',
                    link: '/ks'
                },
                {
                    label: 'link 2 B',
                    link: '/ks'
                },
                {
                    label: 'link 2 C',
                    link: '/ks'
                },
                {
                    label: 'link 2 D',
                    link: '/ks'
                }
            ]
        }
    ];

    constructor(private cdkService: CdkService) {}

    ngOnInit() {
        // setup navbar portal
        this.kitchensinkNavbarPortal = new TemplatePortal(this.kitchensinkNavbarTmpl, undefined, {});
        this.cdkService.setNavbarPortal(this.kitchensinkNavbarPortal);
    }

}
