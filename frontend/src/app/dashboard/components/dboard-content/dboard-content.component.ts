import {
  Component, OnInit, Input, ViewChild, ViewEncapsulation,
  ChangeDetectionStrategy, OnChanges, SimpleChanges, ComponentFactoryResolver,
  HostBinding, Output, EventEmitter, AfterViewInit, ViewChildren, QueryList
} from '@angular/core';
import { GridsterComponent, GridsterItemComponent, IGridsterOptions, IGridsterDraggableOptions } from 'angular2gridster';
import { WidgetViewDirective } from '../../directives/widgetview.directive';
import { WidgetComponent } from '../../widgets/widgetcomponent';
import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../services/intercom.service';

// TODO: TEMP ITEMS ONLY FOR DEV. WILL REMOVE
import { WidgetLoaderComponent } from '../widget-loader/widget-loader.component';

@Component({
  selector: 'app-dboard-content',
  templateUrl: './dboard-content.component.html',
  styleUrls: ['./dboard-content.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DboardContentComponent implements OnInit, AfterViewInit, OnChanges {
  @HostBinding('class.app-dboard-content') private _hostClass = true;

  @ViewChild(WidgetViewDirective) widgetViewContainer: WidgetViewDirective;
  @ViewChild(GridsterComponent) gridster: GridsterComponent;

  @Output() widgetsLayoutUpdate = new EventEmitter();
  @Input() widgets: any[];
  @Input() rerender: any;
  @Input() viewEditMode: boolean;

  cellHeight = 0;
  cellWidth = 0;

  gridsterOptions: IGridsterOptions = {
    // core configuration is default one - for smallest view. It has hidden minWidth: 0.
    lanes: 1, // amount of lanes (cells) in the grid
    direction: 'vertical', // floating top - vertical, left - horizontal
    floating: true, // no gravity floating
    dragAndDrop: true, // enable/disable drag and drop for all items in grid
    resizable: true, // enable/disable resizing by drag and drop for all items in grid
    resizeHandles: {
      s: true,
      e: true,
      w: true,
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
    responsiveDebounce: 200, // window resize debounce time
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

  // TEMPORARY ITEMS
  @ViewChildren(WidgetLoaderComponent) widgetItems: QueryList<WidgetLoaderComponent>;

  constructor(
    private dbService: DashboardService,
    private interCom: IntercomService
  ) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
      // TODO: FOR DEV ONLY
      // Need to remove once developing done
      // console.log('AVI ::', this.widgetItems);
      // this.widgetItems.last.openWidgetView();
  }

  trackByWidget(index: number, widget: any) {
    return widget.id;
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('dboard-content-changes', changes);
    // need to reload grister view to update the UI
    if (changes.rerender && changes.rerender.currentValue.reload) {
      this.gridster.reload();
    }
    if (changes.viewEditMode && !changes.viewEditMode.currentValue) {
        this.widgetViewContainer.viewContainerRef.clear();
    }
  }

  // to load selected component factory
  viewComponent(comp: any) {
    console.log('view component', comp);
    // get the view container
    const viewContainerRef = this.widgetViewContainer.viewContainerRef;
    viewContainerRef.clear();
    // create component using existing widget factory
    const component = viewContainerRef.createComponent(comp.compFactory);
    // assign @input widget
    (<WidgetComponent>component.instance).widget = comp.widget;
    (<WidgetComponent>component.instance).editMode =  true; // let it know it is in edit mode so it shows the config controls
  }

  // change ratio when breakpoint hits
  breakpointChange(event: IGridsterOptions) {
    if (this.viewEditMode) { return; }
    console.log('hit the break!!!');

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
    if (this.viewEditMode) { return; }
    // console.log('reflow', event, event.gridsterComponent.gridster.cellHeight);
    this.cellHeight = event.gridsterComponent.gridster.cellHeight;
    this.cellWidth = event.gridsterComponent.gridster.cellWidth;
    this.dbService.updateWidgetsDimension(this.cellWidth, this.cellHeight, this.widgets);
    // console.log('current widget', this.widgets);
    this.widgetsLayoutUpdate.emit(this.widgets);
  }

  // this event happened when item is dragged or resize
  // we call the function update all since we don't know which one for now.
  // the width and height unit might change but not the cell width and height.
  gridEventEnd(event: any) {
    if (this.viewEditMode) { return; }
    // console.log(event, event.item.$element.getBoundingClientRect());
    if (event.action === 'resize' || event.action === 'drag') {
      this.dbService.updateWidgetsDimension(this.cellWidth, this.cellHeight, this.widgets);
      this.widgetsLayoutUpdate.emit(this.widgets);
      // console.log('item resize', this.widgets);
    }
  }

}
