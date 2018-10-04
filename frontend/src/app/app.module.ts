import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

// components
import { AppComponent } from './app.component';

// custom modules
import { CoreModule } from './core/core.module';
import { MaterialModule } from './shared/modules/material/material.module';
import { AppRoutingModule } from './app-routing.module';

// store
import { NgxsModule } from '@ngxs/store';
import { NgxsLoggerPluginModule, NgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { NgxsRouterPluginModule } from '@ngxs/router-plugin';
import { NgxsReduxDevtoolsPluginModule } from '@ngxs/devtools-plugin';
// import { AppState } from './store/app.state';
// our
import { AdminModule } from './admin/admin.module';
import { AdhocModule } from './adhoc/adhoc.module';
import { NavbarModule } from './shared/modules/navbar/navbar.module';

import { AuthInterceptor } from './core/http/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { AuthState } from './shared/state/auth.state';

import { CredentialsInterceptor } from './core/http/credentials.interceptor';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CoreModule,
    MaterialModule,
    // ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
    AppRoutingModule,
    NgxsModule.forRoot([AuthState]),
    NgxsRouterPluginModule.forRoot(),
    NgxsLoggerPluginModule.forRoot(),
    NgxsReduxDevtoolsPluginModule.forRoot({ disabled: environment.production }),
    AdminModule,
    AdhocModule,
    NavbarModule
  ],
  providers: [
    AuthService,
    /*{
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialsInterceptor,
      multi: true
    }*/
    /*{
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }*/

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
