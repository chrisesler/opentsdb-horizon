import { Injectable } from '@angular/core';
import { WidgetbaseComponent } from '../widgets/components/widgetbase/widgetbase.component';
import { WsampleComponent } from '../widgets/components/wsample/wsample.component';


@Injectable()
export class WidgetService {

  constructor() { }

  getComponentToLoad (name: string) {
    switch (name) {
      case 'WsampleComponent':
        return WsampleComponent;
      default:
        return WidgetbaseComponent;
    }
  }
}
