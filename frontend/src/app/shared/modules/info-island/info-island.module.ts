import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material/material.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { InfoIslandService } from './services/info-island.service';
import { InfoIslandComponent } from './containers/info-island.component';
import { IslandTestComponent } from './components/island-test/island-test.component';

import { ISLAND_DATA } from './info-island.tokens';

@NgModule({
    imports: [
        CommonModule,
        DragDropModule,
        OverlayModule,
        MaterialModule
    ],
    providers: [ InfoIslandService ],
    declarations: [
        InfoIslandComponent,
        IslandTestComponent
    ],
    entryComponents: [
        InfoIslandComponent,
        IslandTestComponent
    ]
})
export class InfoIslandModule { }
