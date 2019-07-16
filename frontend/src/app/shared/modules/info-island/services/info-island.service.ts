import {
    Injectable,
    Injector,
    ElementRef,
    Type,
    ViewContainerRef
} from '@angular/core';

import { ComponentPortal, PortalInjector, Portal, TemplatePortal } from '@angular/cdk/portal';
import { Overlay, OverlayRef, OriginConnectionPosition, OverlayConnectionPosition, ConnectionPositionPair } from '@angular/cdk/overlay';

import { LoggerService } from '../../../../core/services/logger.service';

import { InfoIslandComponent } from '../containers/info-island.component';
import { InfoIslandOptions } from './info-island-options';


import { IslandTestComponent } from '../components/island-test/island-test.component';
import { ISLAND_DATA } from '../info-island.tokens';

@Injectable()
export class InfoIslandService {

    private overlayRef: OverlayRef;
    private islandComp: InfoIslandComponent;

    private readonly DEFAULT_OPTIONS: InfoIslandOptions = {
        closable: true,
        draggable: true,
        width: 600,
        height: 450
    };

    constructor(
        private injector: Injector,
        private overlay: Overlay,
        private logger: LoggerService
    ) {}

    getComponentToLoad(name: string) {
        let retComp: any;
        switch (name) {
            case 'IslandTestComponent':
            default:
                retComp = IslandTestComponent;
                break;

        }

        return retComp;
    }



    /** ISLAND CREATION  */
    openIsland(widgetContainerRef: ElementRef, portalRef: Portal<any>, options?: Partial<InfoIslandOptions>) {
        if (this.overlayRef) {
            this.closeIsland(); // in case there is one open
        }

        this.createOverlayRef(widgetContainerRef);

        const portal = new ComponentPortal(InfoIslandComponent);
        const componentRef = this.overlayRef.attach(portal);

        this.islandComp = componentRef.instance;
        const optionsToPass = JSON.parse(JSON.stringify(this.DEFAULT_OPTIONS));
        if (options) {
            Object.assign(optionsToPass, options);
        }

        /* Dynamic width from the opening widget - commented out for now
        const containerDims = widgetContainerRef.nativeElement.getBoundingClientRect();

        if (containerDims.width > this.DEFAULT_OPTIONS.width && containerDims.width < window.innerWidth) {
            optionsToPass.width = containerDims.width;
        }
        */

        this.islandComp.open(portalRef, optionsToPass);
        this.islandComp.onCloseIsland$.subscribe(() => {
            this.overlayRef.detach();
        });
    }

    closeIsland() {
        if (this.overlayRef.hasAttached()) {
            this.overlayRef.detach();
        }
    }

    private createOverlayRef(elRef: ElementRef) {
        this.overlayRef = this.overlay.create({
            hasBackdrop: false,
            scrollStrategy: this.overlay.scrollStrategies.noop(),
            positionStrategy: this.getPositionStrategy(elRef)
        });
    }

    private getPositionStrategy(elRef: ElementRef) {

        const origin = {
            topLeft: { originX: 'start', originY: 'top' } as OriginConnectionPosition,
            topRight: { originX: 'end', originY: 'top' } as OriginConnectionPosition,
            bottomLeft: { originX: 'start', originY: 'bottom' } as OriginConnectionPosition,
            bottomRight: { originX: 'end', originY: 'bottom' } as OriginConnectionPosition,
            topCenter: { originX: 'center', originY: 'top' } as OriginConnectionPosition,
            bottomCenter: { originX: 'center', originY: 'bottom' } as OriginConnectionPosition,
            center: { originX: 'center', originY: 'center' } as OriginConnectionPosition
        };
        const overlay = {
            topLeft: { overlayX: 'start', overlayY: 'top' } as OverlayConnectionPosition,
            topRight: { overlayX: 'end', overlayY: 'top' } as OverlayConnectionPosition,
            bottomLeft: { overlayX: 'start', overlayY: 'bottom' } as OverlayConnectionPosition,
            bottomRight: { overlayX: 'end', overlayY: 'bottom' } as OverlayConnectionPosition,
            topCenter: { overlayX: 'center', overlayY: 'top' } as OverlayConnectionPosition,
            bottomCenter: { overlayX: 'center', overlayY: 'bottom' } as OverlayConnectionPosition,
            center: { overlayX: 'center', overlayY: 'center' } as OverlayConnectionPosition
        };

        const positionStrategy = this.overlay.position()
            .flexibleConnectedTo(elRef)
            .withFlexibleDimensions(true)
            .withPush(true)
            .withPositions([
                new ConnectionPositionPair(origin.bottomLeft, overlay.topLeft),
                //  new ConnectionPositionPair(origin.topLeft, overlay.topLeft),
                new ConnectionPositionPair(origin.center, overlay.center)
            ]);
        return positionStrategy;
    }

    createInjector(dataToPass): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(ISLAND_DATA, dataToPass);
        return new PortalInjector(this.injector, injectorTokens);
    }
}
