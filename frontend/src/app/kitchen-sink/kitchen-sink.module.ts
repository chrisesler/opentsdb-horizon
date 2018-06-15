import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../shared/modules/material/material.module';
import { KitchenSinkRoutingModule } from './kitchen-sink-routing.module';
import { SharedcomponentsModule } from '../shared/modules/sharedcomponents/sharedcomponents.module';

// Containers
import { KSMainComponent } from './containers/main/main.component';
import { KSHomeComponent } from './containers/home/home.component';

// Components
import { KSPageHeaderComponent } from './components/page-header/page-header.component';


// Components

@NgModule({
    imports: [
        CommonModule,
        MaterialModule,
        SharedcomponentsModule,
        KitchenSinkRoutingModule
    ],
    declarations: [
        KSMainComponent,
        KSHomeComponent,
        KSPageHeaderComponent
    ],
    exports: [
        KSMainComponent
    ]
})
export class KitchenSinkModule { }
