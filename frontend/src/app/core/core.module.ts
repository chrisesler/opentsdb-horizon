import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent} from './components/navbar/navbar.component';
import { D3Service } from './services/d3.service';
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    NavbarComponent
  ],
  exports: [
    CommonModule,
    NavbarComponent
  ],
  providers: [
    D3Service
  ]
})
export class CoreModule { 
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error(`CoreModule has already been loaded. Import Core modules in the AppModule only.`);
    }
  }
}
