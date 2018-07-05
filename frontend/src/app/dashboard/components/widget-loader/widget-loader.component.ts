import {
    Type, Component, OnInit, Input, Output, ViewChild,
    ComponentFactoryResolver, EventEmitter,
    OnChanges, SimpleChanges, HostBinding, ViewContainerRef
} from '@angular/core';
import { WidgetService } from '../../../core/services/widget.service';
import { WidgetDirective } from '../../directives/widget.directive';
import { WidgetComponentModel } from '../../widgets/models/widgetcomponent';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';
import { MatMenu, MatMenuTrigger } from '@angular/material';

@Component({
    selector: 'app-widget-loader',
    templateUrl: './widget-loader.component.html',
    styleUrls: ['./widget-loader.component.scss']
})
export class WidgetLoaderComponent implements OnInit, OnChanges {
    @HostBinding('class.widget-loader') private hostClass = true;
    @Input() widget: any;
    @Output() viewComponent = new EventEmitter<any>();

    @ViewChild(WidgetDirective) widgetContainer: WidgetDirective;
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

    _component: any = null;
    componentFactory: any = null;
    viewContainerRef: any;

    constructor(private widgetService: WidgetService, private interCom: IntercomService,
        private componentFactoryResolver: ComponentFactoryResolver) { }

    ngOnInit() {
        // console.log('WIDGET', this.widget);
        this.loadComponent();
    }

    ngOnChanges(changes: SimpleChanges) {
        // console.log('widget loader changes', changes);
        if (changes.widget) {
            // console.log(JSON.stringify(changes.widget.currentValue));
            // console.log(JSON.stringify(changes.widget.previousValue));

            if (JSON.stringify(changes.widget.currentValue) === JSON.stringify(changes.widget.previousValue)) {
                // console.log('same value');
            } else {
                // console.log('different value');
            }
        }
    }

    loadComponent() {
        console.log('component creating', this.widget.id);
        let componentName = '__notfound__';
        if (this.widget.config.component_type) {
            componentName = this.widget.config.component_type;
        }
        const componentToLoad: Type<any> = this.widgetService.getComponentToLoad(componentName);
        this.componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentToLoad);
        this.viewContainerRef = this.widgetContainer.viewContainerRef;
        this.viewContainerRef.clear();
        // const componentRef = viewContainerRef.createComponent(componentFactory);
        // (<WidgetComponent>componentRef.instance).config = this.widgetconf;
        this._component = this.viewContainerRef.createComponent(this.componentFactory);
        (<WidgetComponentModel>this._component.instance).widget = this.widget;
        (<WidgetComponentModel>this._component.instance).editMode = false;
    }

    /**
     * BEHAVIORS
     */

    // emit component factory and config for edit/view full mode
    widgetView() {
        this.viewComponent.emit({
            'compFactory': this.componentFactory,
            'widget': this.widget
        });
        // request to send in to indicate which widget in editmode
        this.interCom.requestSend(<IMessage> {
            action: 'viewEditMode',
            payload: {editMode: true, widgetId: this.widget.id }
        });
    }

    widgetClone() {
        console.log('CLONE WIDGET CLICKED');
    }

    widgetShare() {
        console.log('SHARE WIDGET CLICKED');
    }

    widgetExportJSON() {
        console.log('EXPORT JSON CLICKED');
    }

    widgetExportImage() {
        console.log('EXPORT IMAGE CLICKED');
    }

    widgetRemove() {
        // we need to implement confirmation later
        this.interCom.requestSend(<IMessage> {
            action: 'removeWidget',
            payload: { widgetId: this.widget.id }
        });
    }

    // TODO: FOR DEV ONLY, NEED TO REMOVE
    // NOTE: TEMPORARY
    public openWidgetView() {
        this.widgetView();
    }
}
