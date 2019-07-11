import {
    Injectable,
    Injector,
    ElementRef
} from '@angular/core';

import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { Overlay, OverlayRef, OriginConnectionPosition, OverlayConnectionPosition, ConnectionPositionPair } from '@angular/cdk/overlay';

import { LoggerService } from '../../../../core/services/logger.service';

import { InfoIslandComponent } from '../containers/info-island.component';
import { InfoIslandOptions } from './info-island-options';

@Injectable()
export class InfoIslandService {

    private overlayRef: OverlayRef;
    private islandComp: InfoIslandComponent;

    private readonly DEFAULT_OPTIONS: InfoIslandOptions = {
        closable: true,
        draggable: true
    };

    constructor(
        private injector: Injector,
        private overlay: Overlay,
        private logger: LoggerService
    ) {}

    openIsland(data: any, widgetContainerRef: ElementRef, options?: Partial<InfoIslandOptions>) {
        if (this.overlayRef) {
            this.closeIsland(); // in case there is one open
        }

        this.createOverlayRef(widgetContainerRef);

        const dataToInject = (data) ? { data } : {};

        const portal = new ComponentPortal(InfoIslandComponent, null, this.createInjector(dataToInject));
        const componentRef = this.overlayRef.attach(portal);

        this.islandComp = componentRef.instance;
        this.islandComp.open({...this.DEFAULT_OPTIONS, ...options});
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

    private createInjector(dataToPass): PortalInjector {
        const injectorTokens = new WeakMap();
        // injectorTokens.set(ISLAND_DATA, dataToPass);
        return new PortalInjector(this.injector, injectorTokens);
    }
}
