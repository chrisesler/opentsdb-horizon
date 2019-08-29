import { Component,OnInit, Inject, OnDestroy, HostBinding,
    AfterViewInit, ViewChild, ElementRef, ViewChildren, QueryList} from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { Subject, Observable, Subscription } from 'rxjs';
import { InfoIslandOptions } from '../services/info-island-options';
import { LoggerService } from '../../../../core/services/logger.service';
import { CdkDrag} from '@angular/cdk/drag-drop';
import { Portal } from '@angular/cdk/portal';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'info-island',
    templateUrl: './info-island.component.html',
    styleUrls: [],
    animations: [
        trigger('infoIslandAnimation', [
            state(
                'void',
                style({
                    // transform: 'translateY(100%)',
                    opacity: 0
                })
            ),
            state(
                '*',
                style({
                    // transform: 'translateY(0)',
                    opacity: 1
                })
            ),
            transition('* <=> void', animate(`400ms cubic-bezier(0.4, 0, 0.1, 1)`))
        ])
    ]
})
export class InfoIslandComponent implements OnInit, OnDestroy, AfterViewInit  {

    constructor(
        private logger: LoggerService,
        private hostEl: ElementRef
    ) {}

    @HostBinding('class.info-island-component') private _hostClass = true;

    @ViewChild('islandContainer', { read: ElementRef }) islandContainer: ElementRef;

    @ViewChild('islandContainer', {read: CdkDrag }) dragContainer: CdkDrag;

    @ViewChildren('resizerEl', { read: ElementRef }) resizers: QueryList<ElementRef>;

    @ViewChildren('resizerEl', { read: CdkDrag }) dragHandles: QueryList<ElementRef>;

    private onCloseIsland = new Subject<void>();
    onCloseIsland$ = this.onCloseIsland.asObservable();

    animationState: '*' | 'void' = 'void';
    private durationTimeoutId: any;

    options: InfoIslandOptions = {
        originId: false,
        closable: false,
        draggable: true,
        width: 600,
        height: 300,
        showActions: false
    };

    minimum_size = {x: 500, y: 200};
    origDims: any = {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        // mouse_x: 0,
        // mouse_y: 0,
        pointerPosition: { x: 0, y: 0},
        transformMatrix: [0, 0, 0]
    };

    hostPosition: any;

    _mouseMoveEvent: any;
    _mouseUpEvent: any;

    portalRef: Portal<any>; // item to be displayed in island

    ngOnInit() { }

    ngAfterViewInit() {
        this.hostPosition = this.hostEl.nativeElement.getBoundingClientRect();
        this.logger.log('ISLAND', { island: this.islandContainer });
        this.logger.log('ResizerEls', { resizers: this.resizers });
        //this.hostEl.nativeElement.style.width = 0;
        //this.hostEl.nativeElement.style.height = 0;
    }

    open(portalRef: Portal<any>, options: any) {
        // merge options
        Object.assign(this.options, options);

        this.hostEl.nativeElement.style.width = options.width + 'px';
        this.hostEl.nativeElement.style.height = options.height + 'px';
        this.hostPosition = this.hostEl.nativeElement.getBoundingClientRect();

        this.portalRef = portalRef;
        this.animationState = '*';
    }

    close() {
        this.animateClose();
    }

    animateClose() {
        this.animationState = 'void';
        clearTimeout(this.durationTimeoutId);
    }

    animationDone() {
        if (this.animationState === 'void') {
            this.hostEl.nativeElement.style.width = this.hostPosition.width;
            this.hostEl.nativeElement.style.height = this.hostPosition.height;
            this.onCloseIsland.next();
        }
    }

    /** window dragging */

    dragIslandWindow(event: any) { }

    /** Corner Resizing */
    private getTransformMatrix(el: any) {
        const transArr = [];
        if (!window.getComputedStyle) {
            return;
        }
        const elStyle = window.getComputedStyle(el),

        // tslint:disable-next-line: deprecation
        transform = elStyle.transform || elStyle.webkitTransform;

        if (transform === 'none') {
            return [0, 0, 0];
        }

        let mat = transform.match(/^matrix3d\((.+)\)$/);
        if (mat) {
            return parseFloat(mat[1].split(', ')[13]);
        }

        mat = transform.match(/^matrix\((.+)\)$/);
        transArr.push( mat ? parseFloat(mat[1].split(', ')[4]) : 0);
        transArr.push( mat ? parseFloat(mat[1].split(', ')[5]) : 0);
        transArr.push(0);
        return transArr;
    }

    dragResizeStart(e: any) {
        // this.logger.log('dragResizeStart', {event: e});

        const element = this.islandContainer.nativeElement;
        this.origDims.width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
        this.origDims.height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
        this.origDims.x = element.getBoundingClientRect().left;
        this.origDims.y = element.getBoundingClientRect().top;
        this.origDims.pointerPosition = e.source._pickupPositionOnPage;

        const transformMatrix = this.getTransformMatrix(element);
        this.origDims.transformMatrix = transformMatrix;
    }

    dragResizeMove(e: any) {
        // this.logger.log('dragResizeMove', {event: e, dragContainer: this.dragContainer});
        const currentResizer = e.source.element.nativeElement;
        const element = this.islandContainer.nativeElement;

        let width: any;
        let height: any;
        const transform: any = [...this.origDims.transformMatrix];
        let triggerTransform = false;
        let diff: any;

        if (currentResizer.classList.contains('bottom-right')) {

            width = this.origDims.width + (e.pointerPosition.x - this.origDims.pointerPosition.x);
            height = this.origDims.height + (e.pointerPosition.y - this.origDims.pointerPosition.y);

            if (width > this.minimum_size.x) {
                element.style.width = width + 'px';
            }
            if (height > this.minimum_size.y) {
                element.style.height = height + 'px';
            }

            // this.logger.log('BOTTOM-RIGHT', {origin: this.origDims, width, height});
        } else if (currentResizer.classList.contains('bottom-left')) {
            width = this.origDims.width - (e.pointerPosition.x - this.origDims.pointerPosition.x);
            height = this.origDims.height + (e.pointerPosition.y - this.origDims.pointerPosition.y);

            if (height > this.minimum_size.y) {
                element.style.height = height + 'px';
            }
            if (width > this.minimum_size.x) {
                element.style.width = width + 'px';
                diff = (e.pointerPosition.x - this.origDims.pointerPosition.x);
                transform[0] = (e.delta.x === 1) ? transform[0] + diff : transform[0] - (diff * e.delta.x);
                triggerTransform = true;
            }

            // this.logger.log('BOTTOM-LEFT', {origin: this.origDims, width, height, diff });

        } else if (currentResizer.classList.contains('top-right')) {
            width = this.origDims.width + (e.pointerPosition.x - this.origDims.pointerPosition.x);
            height = this.origDims.height - (e.pointerPosition.y - this.origDims.pointerPosition.y);

            if (width > this.minimum_size.x) {
                element.style.width = width + 'px';
            }

            if (height > this.minimum_size.y) {
                element.style.height = height + 'px';
                diff = (e.pointerPosition.y - this.origDims.pointerPosition.y);
                transform[1] = (e.delta.y === 1) ? transform[1] + diff : transform[1] - (diff * e.delta.y);
                triggerTransform = true;
            }
            // this.logger.log('TOP-RIGHT', {origin: this.origDims, width, height, diff });
        } else {

            width = this.origDims.width - (e.pointerPosition.x - this.origDims.pointerPosition.x);
            height = this.origDims.height - (e.pointerPosition.y - this.origDims.pointerPosition.y);
            let diffX: any;
            let diffY: any;

            if (width > this.minimum_size.x) {
                element.style.width = width + 'px';
                diff = (e.pointerPosition.x - this.origDims.pointerPosition.x);
                diffX = diff;
                transform[0] = (e.delta.x === 1) ? transform[0] + diff : transform[0] - (diff * e.delta.x);
                triggerTransform = true;
            }
            if (height > this.minimum_size.y) {
                element.style.height = height + 'px';
                diff = (e.pointerPosition.y - this.origDims.pointerPosition.y);
                diffY = diff;
                transform[1] = (e.delta.y === 1) ? transform[1] + diff : transform[1] - (diff * e.delta.y);
                triggerTransform = true;
            }

            // this.logger.log('TOP-LEFT', {origin: this.origDims, width, height, diffX, diffY });

        }
        if (triggerTransform) {
            element.style.transform = 'translate3d(' + transform.join('px,') + 'px)';
        }

        currentResizer.style.transform = 'translate3d(0, 0, 0)';
    }

    dragResizeRelease(e: any) {
        this.logger.log('dragResizeRelease', {event: e});
    }

    /** On Destroy */

    ngOnDestroy() {
        this.onCloseIsland.unsubscribe();
    }

}
