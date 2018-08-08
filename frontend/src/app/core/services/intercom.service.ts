import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export interface IMessage {
  id?: string;
  action: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class IntercomService {

  private requestStream: Subject<IMessage>;
  private responseStream: BehaviorSubject<IMessage>;

  constructor() {
    this.requestStream = new Subject();
    this.responseStream = new BehaviorSubject(null);
  }

  // child makes request
  requestSend( event: IMessage) {
    this.requestStream.next(event);
  }

  // parent listens (subscribe) to child requests
  requestListen(): Observable<IMessage> {
    return this.requestStream.asObservable();
  }

  // parent put (send) data to response stream
  responsePut(event: IMessage) {
    this.responseStream.next(event);
  }

  // child get data response from parents
  responseGet(): Observable<IMessage> {
    return this.responseStream.asObservable();
  }

}
