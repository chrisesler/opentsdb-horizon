import {
  Component, OnInit, Input, ViewChild, ViewEncapsulation,
  ChangeDetectionStrategy, OnChanges, SimpleChanges, ComponentFactoryResolver,
  HostBinding
} from '@angular/core';
import { GridsterComponent, GridsterItemComponent, IGridsterOptions, IGridsterDraggableOptions } from 'angular2gridster';
import { WidgetViewDirective } from '../../directives/widgetview.directive';
import { WidgetComponent } from '../../widgets/widgetcomponent';
import { DashboardService } from '../../services/dashboard.service';
import { Store } from '@ngxs/store';
import { IntercomService, IMessage } from '../../services/intercom.service';

@Component({
  selector: 'app-dboard-content',
  templateUrl: './dboard-content.component.html',
  styleUrls: ['./dboard-content.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DboardContentComponent implements OnInit, OnChanges {
  @HostBinding('class.app-dboard-content') private _hostClass = true;
  @HostBinding('class.view-edit-mode') private _viewEditMode = false;

  @ViewChild(WidgetViewDirective) widgetViewContainer: WidgetViewDirective;
  @ViewChild(GridsterComponent) gridster: GridsterComponent;

  @Input() widgets: any[];
  @Input() rerender: any;

  @Input()
  get viewEditMode() {
    return this._viewEditMode;
  }

  set viewEditMode(value: boolean) {
    this._viewEditMode = value;
    if(!value){
      this.closeEditView();
    }
  }

  cellHeight = 0;
  cellWidth = 0;

  constructor(private dbService: DashboardService, private interCom: IntercomService, private store: Store) { }

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
      se: true
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

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    console.log('sasas', changes);
    if (changes.rerender && changes.rerender.currentValue.reload) {
      this.gridster.reload();
    }
  }

  closeEditView() {
    // clear out the editMode widget
    this.widgetViewContainer.viewContainerRef.clear();
  }

  // to load selected component factory
  viewComponent(comp: any) {
    // get the view container
    const viewContainerRef = this.widgetViewContainer.viewContainerRef;
    viewContainerRef.clear();

    // create component using existing widget factory
    const component = viewContainerRef.createComponent(comp.compFactory);

    // give the widget it's config
    (<WidgetComponent>component.instance).config = comp.config;

  }

  breakpointChange(event: IGridsterOptions) {
    console.log('breakpoint', event);
    let ratio = 2;
    if (event.lanes === 1) {
      ratio = 4;
    }
    if (this.gridster.isReady) {
      this.gridster.setOption('widthHeightRatio', ratio).reload();
    }
  }
  // this event will start first and set values of cellWidth and cellHeight
  // then update the this.widgets reference
  gridsterFlow(event: any) {
    //console.log('reflow', event, event.gridsterComponent.gridster.cellHeight);
    this.cellHeight = event.gridsterComponent.gridster.cellHeight;
    this.cellWidth = event.gridsterComponent.gridster.cellWidth;
    this.dbService.updateWidgetsDimension(this.cellWidth, this.cellHeight, this.widgets);
    console.log('state', this.store.snapshot());
    
  }

  // this event happened when item is dragged or resize
  // we call the function update all since we don't know which one for now.
  // the width and height unit might change but not the cell width and height.
  gridEventEnd(event: any) {
    //console.log(event, event.item.$element.getBoundingClientRect());
    if (event.action === 'resize') {
      this.dbService.updateWidgetsDimension(this.cellWidth, this.cellHeight, this.widgets);
      //console.log('item resize', this.widgets);
    }
    console.log('state', this.store.snapshot());
  }

}
