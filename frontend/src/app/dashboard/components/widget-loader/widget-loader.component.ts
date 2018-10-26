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
import { load } from '@angular/core/src/render3/instructions';

@Component({
    selector: 'app-widget-loader',
    templateUrl: './widget-loader.component.html',
    styleUrls: ['./widget-loader.component.scss']
})
export class WidgetLoaderComponent implements OnInit, OnChanges {
    @HostBinding('class.widget-loader') private hostClass = true;
    @Input() widget: any;
    @Output() editComponent = new EventEmitter<any>();

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

            if ( changes.widget.previousValue !== undefined && changes.widget.currentValue ) {
                const oldConfig = changes.widget.previousValue;
                const newConfig = changes.widget.currentValue;
                if ( oldConfig.settings.component_type !== newConfig.settings.component_type ) {
                    console.log(oldConfig.settings.component_type, newConfig.settings.component_type, "widget config changes");
                    this.loadComponent();
                }
            }
        }
    }

    loadComponent() {
        console.log('component creating', this.widget.id, this.widget.settings.component_type);
        let componentName = '__notfound__';
        if (this.widget.settings.component_type) {
            componentName = this.widget.settings.component_type;
        }
        const componentToLoad: Type<any> = this.widgetService.getComponentToLoad(componentName);
        this.componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentToLoad);
        this.viewContainerRef = this.widgetContainer.viewContainerRef;
        this.viewContainerRef.clear();
        // const componentRef = viewContainerRef.createComponent(componentFactory);
        // (<WidgetComponent>componentRef.instance).config = this.widgetconf;
        this._component = this.viewContainerRef.createComponent(this.componentFactory);

        if ( componentName === 'PlaceholderWidgetComponent' ) {
            this._component.instance.loadNewWidget.subscribe( wConfig => {
                const component: Type<any> = this.widgetService.getComponentToLoad(wConfig.type);
                const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
                const widget = JSON.parse(JSON.stringify(this.widget)); // copy the widget config
                widget.settings.component_type = wConfig.type;
                this.editComponent.emit({
                    'compFactory': componentFactory,
                    'widget': widget
                });
                // intercom to container to update state
                this.interCom.requestSend(<IMessage> {
                    action: 'updateDashboardMode',
                    payload: 'edit'
                });
            });
        }

        (<WidgetComponentModel>this._component.instance).widget = this.widget;
        (<WidgetComponentModel>this._component.instance).editMode = false;
    }

    // when user clicks on view-edit
    // emit component factory and config for edit/view full mode
    editWidget() {
        this.editComponent.emit({
            'compFactory': this.componentFactory,
            'widget': this.widget
        });
        // intercom to container to update state
        this.interCom.requestSend(<IMessage> {
            action: 'updateDashboardMode',
            payload: 'edit'
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
}
