import { Component, OnInit, Inject, OnDestroy, HostBinding, AfterViewInit, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { ISLAND_DATA } from '../info-island.tokens';
import { Subject, Observable, Subscription } from 'rxjs';
import { InfoIslandOptions } from '../services/info-island-options';
import { LoggerService } from '../../../../core/services/logger.service';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-info-island',
    templateUrl: './info-island.component.html',
    styleUrls: [],
    animations: [
        trigger('infoIslandAnimation', [
            state(
                'void',
                style({
                    //transform: 'translateY(100%)',
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
export class InfoIslandComponent implements OnInit, OnDestroy, AfterViewInit {

    constructor(
        @Inject(ISLAND_DATA) public data,
        private logger: LoggerService,
        private hostEl: ElementRef
    ) { }

    @HostBinding('class.info-island-component') private _hostClass = true;

    @ViewChild('islandContainer', { read: ElementRef }) islandContainer: ElementRef;

    @ViewChild('islandContainer', {read: CdkDrag }) dragContainer: CdkDrag;

    @ViewChildren('resizerEl', { read: ElementRef }) resizers: QueryList<ElementRef>;

    @ViewChildren('resizerEl', { read: CdkDrag }) dragHandles: QueryList<ElementRef>;

    private onDestroy = new Subject<void>();
    onDestroy$ = this.onDestroy.asObservable();

    animationState: '*' | 'void' = 'void';
    private durationTimeoutId: any;

    options: InfoIslandOptions = {
        closable: false,
        draggable: true
    };

    minimum_size = {x: 150, y: 100};
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

    ngOnInit() { }

    ngOnDestroy() {
        this.onDestroy.unsubscribe();
    }

    ngAfterViewInit() {
        this.hostPosition = this.hostEl.nativeElement.getBoundingClientRect();
        // this.makeResizable();
        this.logger.log('ISLAND', { island: this.islandContainer });
        this.logger.log('ResizerEls', { resizers: this.resizers });
    }

    open(options?: any) {
        if (options) {
            this.options = options;
        }
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
            this.onDestroy.next();
        }
    }

    /*private makeResizable() {
        const element = this.islandContainer.nativeElement;
        const resizers = this.resizers;
        const minimum_size = 20;
        let original_width = 0;
        let original_height = 0;
        let original_x = 0;
        let original_y = 0;
        let original_mouse_x = 0;
        let original_mouse_y = 0;


        const self = this;

        resizers.forEach(item => {
            const currentResizer = item.nativeElement;
            console.log('currentResizer', currentResizer);

            currentResizer.addEventListener('mousedown', function(e) {
                e.preventDefault()
                original_width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
                original_height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
                original_x = element.getBoundingClientRect().left;
                original_y = element.getBoundingClientRect().top;
                original_mouse_x = e.pageX;
                original_mouse_y = e.pageY;
                window.addEventListener('mousemove', resize)
                window.addEventListener('mouseup', stopResize)
            });

            currentResizer
        });

        function resize(e) {

        }

        function resizeStop() {

        }
    }

    mouseDownResize(event: any) {
        event.preventDefault();
        this.dragContainer.disabled = true;

        const element = this.islandContainer.nativeElement;
        this.origDims.width = parseFloat(getComputedStyle(element, null).getPropertyValue('width').replace('px', ''));
        this.origDims.height = parseFloat(getComputedStyle(element, null).getPropertyValue('height').replace('px', ''));
        this.origDims.x = element.getBoundingClientRect().left;
        this.origDims.y = element.getBoundingClientRect().top;
        this.origDims.mouse_x = event.pageX;
        this.origDims.mouse_y = event.pageY;

        const transformMatrix = this.getTransformMatrix(element);
        this.origDims.transformMatrix = transformMatrix;

        this._mouseMoveEvent = window.addEventListener('mousemove', this.mouseMoveResize.bind(this));
        if (!this._mouseUpEvent) {
            this._mouseUpEvent = window.addEventListener('mouseup', this.mouseUpStopResize.bind(this));
        }
    }

    mouseMoveResize(event: any) {
        this.logger.action('MOUSE MOVE EVENT', { event, origin: this.origDims });
        const currentResizer = event.srcElement;
        const element = this.islandContainer.nativeElement;

        if (currentResizer.classList.contains('bottom-right')) {
            this.logger.log('BOTTOM-RIGHT');
            const width = this.origDims.width + (event.pageX - this.origDims.mouse_x);
            const height = this.origDims.height + (event.pageY - this.origDims.mouse_y);
            if (width > this.minimum_size) {
                element.style.width = width + 'px';
            }
            if (height > this.minimum_size) {
                element.style.height = height + 'px';
            }
        } else if (currentResizer.classList.contains('bottom-left')) {
            this.logger.log('BOTTOM-LEFT');
            const height = this.origDims.height + (event.pageY - this.origDims.mouse_y);
            const width = this.origDims.width - (event.pageX - this.origDims.mouse_x);
            if (height > this.minimum_size) {
                element.style.height = height + 'px';
            }
            if (width > this.minimum_size) {
                element.style.width = width + 'px';
                //element.style.left = this.origDims.x + (event.pageX - this.origDims.mouse_x) + 'px';
                //element.style.transform = 'translate3d(' + this.origDims.tran
            }
        } else if (currentResizer.classList.contains('top-right')) {
            this.logger.log('TOP-RIGHT');
            const width = this.origDims.width + (event.pageX - this.origDims.mouse_x);
            const height = this.origDims.height - (event.pageY - this.origDims.mouse_y);
            if (width > this.minimum_size) {
                element.style.width = width + 'px';
            }
            if (height > this.minimum_size) {
                element.style.height = height + 'px';
                //element.style.top = this.origDims.y + (event.pageY - this.origDims.mouse_y) + 'px';
            }
        } else {
            this.logger.log('TOP-LEFT');
            const width = this.origDims.width - (event.pageX - this.origDims.mouse_x);
            const height = this.origDims.height - (event.pageY - this.origDims.mouse_y);
            if (width > this.minimum_size) {
                element.style.width = width + 'px'
                //element.style.left = this.origDims.x + (event.pageX - this.origDims.mouse_x) + 'px';
            }
            if (height > this.minimum_size) {
                element.style.height = height + 'px';
                //element.style.top = this.origDims.y + (event.pageY - this.origDims.mouse_y) + 'px';
            }
        }
    }

    mouseUpStopResize(event: any) {
        window.removeEventListener('mousemove', this._mouseMoveEvent);
        //window.removeEventListener('mouseup', this._mouseUpEvent);
        this.dragContainer.disabled = false;
    }*/

    private getTransformMatrix(el: any) {
        const transArr = [];
        if (!window.getComputedStyle) {
            return;
        }
        const elStyle = window.getComputedStyle(el),

        transform = elStyle.transform || elStyle.webkitTransform;

        if (transform === 'none') {
            return [0, 0, 0];
        }

        let mat = transform.match(/^matrix3d\((.+)\)$/);
        if (mat) {
            return parseFloat(mat[1].split(', ')[13]);
        }

        mat = transform.match(/^matrix\((.+)\)$/);
        mat ? transArr.push(parseFloat(mat[1].split(', ')[4])) : 0;
        mat ? transArr.push(parseFloat(mat[1].split(', ')[5])) : 0;
        transArr.push(0);
        return transArr;
    }





    dragResizeStart(e: any) {
        this.logger.log('dragResizeStart', {event: e});

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
        this.logger.log('dragResizeMove', {event: e, dragContainer: this.dragContainer});
        const currentResizer = e.source.element.nativeElement;
        const element = this.islandContainer.nativeElement;

        let width: any;
        let height: any;
        let transform: any = [...this.origDims.transformMatrix];
        let triggerTransform: boolean = false;
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

            this.logger.log('BOTTOM-RIGHT', {origin: this.origDims, width, height});
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

            this.logger.log('BOTTOM-LEFT', {origin: this.origDims, width, height, diff });

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
            this.logger.log('TOP-RIGHT', {origin: this.origDims, width, height, diff });
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

            this.logger.log('TOP-LEFT', {origin: this.origDims, width, height, diffX, diffY });

        }
        if (triggerTransform) {
            element.style.transform = 'translate3d(' + transform.join('px,') + 'px)';
        }

        currentResizer.style.transform = 'translate3d(0, 0, 0)';
    }

    dragResizeRelease(e: any) {
        this.logger.log('dragResizeRelease', {event: e});
    }


}
