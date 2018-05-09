import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

// component
import { AppComponent } from './app.component';

// custom modules
import { CoreModule } from './core/core.module';
import { MaterialModule } from './shared/modules/material/material.module';
import { AppRoutingModule } from './app-routing.module';

// our
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdhocModule } from './adhoc/adhoc.module';
import { KitchenSinkModule } from './kitchen-sink/kitchen-sink.module';
import { NavbarModule } from './navbar/navbar.module';
import { HomeModule } from './home/home.module';

import { IntercomService } from './dashboard/services/intercom.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,
    MaterialModule,
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule,
    AdminModule,
    DashboardModule,
    AdhocModule,
    KitchenSinkModule,
    NavbarModule,
    HomeModule
  ],
  providers: [
    IntercomService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
