import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';

// custom modules
import { CoreModule } from './core/core.module';
import { MaterialModule } from './shared/modules/material/material.module';
import { AppRoutingModule } from './app-routing.module';
import { AdminModule } from './admin/admin.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AdhocModule } from './adhoc/adhoc.module';
import { KitchenSinkModule } from './kitchen-sink/kitchen-sink.module';

// component
import { AppComponent } from './app.component';


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
    KitchenSinkModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
