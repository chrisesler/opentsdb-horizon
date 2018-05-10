import { Component, OnInit, OnDestroy, HostBinding, ChangeDetectionStrategy  } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { IntercomService, IMessage } from '../../services/intercom.service';
import { Subscription } from 'rxjs/Subscription';
import { Store, Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { LoadDashboard } from '../../state/dashboard.actions';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, OnDestroy {

  @HostBinding('class.app-dashboard') private hostClass = true;

  // @Select((state: any) => state.dashboardState.widgets)
  // widgets$: Observable<any[]>;


  listenSub: Subscription;
  widgets$: Observable<any>;
  hasHeader: boolean;
  rerender: any = {'reload': false};
  constructor(private store: Store, private interCom: IntercomService, private dbService: DashboardService) { 
    this.widgets$ = this.store.select(state => state.dashboardState.widgets);
  }

  ngOnInit() {
    console.log('snapshot', this.store.snapshot());
    
      this.hasHeader = true;
      //this.dashboard = this.dbService.dashboard;
      // console.log('dash', this.dashboard);
      // this.widgets = this.dashboard.widgets;
      // ready to handle request from children of DashboardModule
      this.listenSub = this.interCom.requestListen().subscribe((message: IMessage) => {
        // console.log('listen to: ', JSON.stringify(message));
      });
      this.store.dispatch(new LoadDashboard('xyz'));
      
   }

   addNewWidget() {
     this.dbService.addNewWidget();
     this.rerender = {'reload': true};
   }

   ngOnDestroy() {
     this.listenSub.unsubscribe();
   }

}
