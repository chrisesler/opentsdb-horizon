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
