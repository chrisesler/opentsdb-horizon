import {
  Type, Component, OnInit, Input, Output, ViewChild,
  ComponentFactoryResolver, EventEmitter,
  OnChanges, SimpleChanges, HostBinding
} from '@angular/core';
import { WidgetService } from '../../services/widget.service';
import { WidgetDirective } from '../../directives/widget.directive';
import { WidgetComponent } from '../../widgets/widgetcomponent';
import { IntercomService, IMessage } from '../../services/intercom.service';

import { MatMenu, MatMenuTrigger } from '@angular/material';

@Component({
  selector: 'app-widget-loader',
  templateUrl: './widget-loader.component.html',
  styleUrls: ['./widget-loader.component.scss']
})
export class WidgetLoaderComponent implements OnInit, OnChanges {
  @HostBinding('class.widget-loader') private hostClass = true;
  // @HostBinding('style.display') display: string;

  @Input() widgetconf: any; // will need to define widget conf type
  @ViewChild(WidgetDirective) widgetContainer: WidgetDirective;
  @Output('viewComponent') viewComponent = new EventEmitter<any>();

  @ViewChild( MatMenuTrigger ) trigger: MatMenuTrigger;

  _component: any = null;
  componentFactory: any = null;

  constructor(private widgetService: WidgetService, private interCom: IntercomService,
    private componentFactoryResolver: ComponentFactoryResolver) { }

  ngOnInit() {
    // this.display = 'block';
    this.loadComponent();
  }

  ngOnChanges(changes: SimpleChanges) {

  }
  // emit component factory and config for edit/view full mode
  widgetView(wConfig) {
    this.viewComponent.emit({ 'compFactory': this.componentFactory, 'config': this.widgetconf });
  }

  loadComponent() {
    let componentName = '__notfound__';
    if (this.widgetconf.component_type) {
      componentName = this.widgetconf.component_type;
    }
    const componentToLoad: Type<any> = this.widgetService.getComponentToLoad(componentName);
    this.componentFactory = this.componentFactoryResolver.resolveComponentFactory(componentToLoad);
    const viewContainerRef = this.widgetContainer.viewContainerRef;
    viewContainerRef.clear();

    // const componentRef = viewContainerRef.createComponent(componentFactory);
    // (<WidgetComponent>componentRef.instance).config = this.widgetconf;
    this._component = viewContainerRef.createComponent(this.componentFactory);
    (<WidgetComponent>this._component.instance).config = this.widgetconf;

  }
}
