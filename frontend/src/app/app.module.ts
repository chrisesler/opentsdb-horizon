import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ServiceWorkerModule } from '@angular/service-worker';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

// custom modules
import { HeaderModule } from './header/header.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdhocModule } from './adhoc/adhoc.module';

// custom services
import { D3Service } from './shared/services/d3.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
    HeaderModule,
    AdminModule,
    DashboardModule,
    AdhocModule
  ],
  providers: [D3Service],
  bootstrap: [AppComponent]
})
export class AppModule { }
