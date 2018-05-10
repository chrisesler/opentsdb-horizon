import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private http: HttpClient) { }

  private dashboard: any  = {
    id: '123456',
    settings: {
      title: 'my dashboard'
    },
    widgets: [
      {
        gridPos: {
          x: 0, y: 0,
          w: 6, h: 5
        },
        config: {
          title: 'One',
          component_type: 'WsampleComponent'
        }
      },
      {
        gridPos: {
          x: 0, y: 5,
          w: 6, h: 5,
        },
        config: {
          title: 'Two',
          component_type: 'WsampleComponent'
        }
      },
      {
        gridPos: {
          x: 6, y: 0,
          w: 6, h: 5
        },
        config: {
          title: 'Three'
        }
      },
      {
        gridPos: {
          x: 6, y: 5,
          w: 6, h: 5,
        },
        config: {
          title: 'Four',
          component_type: 'StaticImageComponent'
        }
      }
    ]
  };

  getDashoard(id: string): Observable<any> {
    return Observable.of(this.dashboard);
  }
}
