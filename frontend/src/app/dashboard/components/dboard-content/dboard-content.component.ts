import {
  Component, Input, ViewChild, ViewEncapsulation,
  OnChanges, SimpleChanges, ComponentFactoryResolver, Type,
  HostBinding, Output, EventEmitter
} from '@angular/core';
import { GridsterComponent, GridsterItemComponent, IGridsterOptions, IGridsterDraggableOptions } from 'angular2gridster';
import { WidgetViewDirective } from '../../directives/widgetview.directive';
import { WidgetComponentModel } from '../../widgets/models/widgetcomponent';
import { DashboardService } from '../../services/dashboard.service';
import { WidgetService } from '../../../core/services/widget.service';
import { IntercomService, IMessage } from '../../../core/services/intercom.service';

@Component({
  selector: 'app-dboard-content',
  templateUrl: './dboard-content.component.html',
  styleUrls: ['./dboard-content.component.scss'],
  encapsulation: ViewEncapsulation.None
})
// changeDetection: ChangeDetectionStrategy.OnPush
export class DboardContentComponent implements OnChanges {
  @HostBinding('class.app-dboard-content') private _hostClass = true;

  @ViewChild(WidgetViewDirective) widgetViewContainer: WidgetViewDirective;
  @ViewChild(GridsterComponent) gridster: GridsterComponent;

  @Output() widgetsLayoutUpdate = new EventEmitter();
  @Input() widgets: any[];
  @Input() newWidget: any; // new widget when adding from top bar
  @Input() rerender: any;
  @Input() dashboardMode: string;

  // tslint:disable-next-line:no-inferrable-types
  viewEditMode: boolean = false;

  gridsterOptions: IGridsterOptions = {
    // core configuration is default one - for smallest view. It has hidden minWidth: 0.
    lanes: 1, // amount of lanes (cells) in the grid
    direction: 'vertical', // floating top - vertical, left - horizontal
    floating: true, // no gravity floating
    dragAndDrop: true, // enable/disable drag and drop for all items in grid
    resizable: true, // enable/disable resizing by drag and drop for all items in grid
    resizeHandles: {
      e: true,
      w: true,
      s: true,
      se: true,
      sw: true
    },
    widthHeightRatio: 2, // proportion between item width and height
    lines: {
      visible: false,
      color: '#afafaf',
      width: 1
    },
    shrink: true,
    useCSSTransforms: true,
    responsiveView: true, // turn on adopting items sizes on window resize and enable responsiveOptions
    responsiveDebounce: 0, // window resize debounce time
    responsiveOptions: [
      {
        breakpoint: 'sm',
        lanes: 1,
      },
      {
        breakpoint: 'md',
        minWidth: 768,
        lanes: 12,
      }
    ]
  };

  gridsterDraggableOptions: IGridsterDraggableOptions = {
    handlerClass: 'panel-heading'
  };

  constructor(
    private dbService: DashboardService,
    private widgetService: WidgetService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private interCom: IntercomService
  ) { }

  getWidgetConfig(id) {
    return this.dbService.getWidgetConfigById(id);
  }

  trackByWidget(index: number, widget: any) {
    return widget.id;
  }

  ngOnChanges(changes: SimpleChanges) {
    // need to reload grister view to update the UI
    if (changes.rerender && changes.rerender.currentValue.reload) {
      this.gridster.reload();
    }

    if (changes.dashboardMode && changes.dashboardMode.currentValue === 'edit') {
      this.viewEditMode = true;
    } else if ( changes.dashboardMode && changes.dashboardMode.currentValue !== 'edit') {
      this.viewEditMode = false;
      if (this.widgetViewContainer.viewContainerRef) {
        this.widgetViewContainer.viewContainerRef.clear();
      }
    }
    // check if the new editing widget is needed
    if ( changes.newWidget && changes.newWidget.currentValue ) {
      this.newComponent(changes.newWidget.currentValue);
    }

  }

  newComponent(widget) {
    //this.viewEditMode = true;
    this.interCom.requestSend(<IMessage> {
      action: 'setDashboardEditMode',
      payload: 'edit'
    });    
    const component: Type<any> = this.widgetService.getComponentToLoad(widget.settings.component_type);
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
    widget.settings = { ...widget.settings, ...this.widgetService.getWidgetDefaultSettings(widget.settings.component_type)};
    this.editComponent( { 'compFactory': componentFactory, widget: widget });
  }

  // to load selected component factory to edit
  editComponent(comp: any) {
    // console.log('component to edit:', comp);
    // get the view container
    const viewContainerRef = this.widgetViewContainer.viewContainerRef;
    viewContainerRef.clear();
    // create component using existing widget factory
    const component = viewContainerRef.createComponent(comp.compFactory);
    // we posfix __EDIT__ to original widget id
    // tslint:disable-next-line:prefer-const
    let editWidget = JSON.parse(JSON.stringify(comp.widget));
    editWidget.id = '__EDIT__' + comp.widget.id;
    // assign @input widget
    console.log('new widget to edit', editWidget);
    (<WidgetComponentModel>component.instance).widget = editWidget;
    (<WidgetComponentModel>component.instance).editMode =  true; // let it know it is in edit mode so it shows the config controls
  }

  // change ratio when breakpoint hits
  breakpointChange(event: IGridsterOptions) {
    if (this.viewEditMode) { return; }
    // console.log('hit the break!!!');

    let ratio = 2;
    if (event.lanes === 1) {
      ratio = 8;
    }

    if (this.gridster && this.gridster.isReady) {
      this.gridster.setOption('widthHeightRatio', ratio).reload();
    }

  }

  // this event will start first and set values of cellWidth and cellHeight
  // then update the this.widgets reference
  gridsterFlow(event: any) {
    // console.log('gridsterFlow is calling and viewEditMode', this.viewEditMode);
    if (this.viewEditMode) { return; }
    // console.log('reflow', event, event.gridsterComponent.gridster.cellHeight);

    const width = event.gridsterComponent.gridster.cellWidth;
    const height = event.gridsterComponent.gridster.cellHeight;
    this.widgetsLayoutUpdate.emit(this.getWigetPosition(width, height));
  }

  // this event happened when item is dragged or resize
  // we call the function update all since we don't know which one for now.
  // the width and height unit might change but not the cell width and height.
  gridEventEnd(event: any) {
    // console.log('drag-resize event', event);
    // console.log('gridEventEnd is calling and viewEditMode', this.viewEditMode);
    if (this.viewEditMode) { return; }
    // console.log(event, event.item.$element.getBoundingClientRect());
    if (event.action === 'resize' || event.action === 'drag') {
      const width = event.item.itemComponent.gridster.cellWidth;
      const height = event.item.itemComponent.gridster.cellHeight;
      this.widgetsLayoutUpdate.emit(this.getWigetPosition(width, height));
    }
  }

  // helper
  getWigetPosition(width: number, height: number): any {
    const gridLayout = {
      clientSize: {
        width: width,
        height: height
      },
      wgridPos: {}
    };
    // position
    for (let i = 0; i < this.widgets.length; i++) {
      const w = this.widgets[i];
      gridLayout.wgridPos[w.id] = {
        x: w.gridPos.xMd,
        y: w.gridPos.yMd,
        w: w.gridPos.w,
        h: w.gridPos.h
      };
    }
    return gridLayout;
  }

}
