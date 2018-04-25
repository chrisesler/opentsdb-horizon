import { NgModule } from '@angular/core';
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
    NavbarComponent
  ],
  providers: []
})
export class CoreModule { }
