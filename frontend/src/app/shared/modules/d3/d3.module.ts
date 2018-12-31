import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { D3PieChartDirective } from './components/d3-pie-chart.directive';

@NgModule({
  declarations: [D3PieChartDirective],
  imports: [
    CommonModule
  ],
  exports: [D3PieChartDirective]
})
export class D3Module { }
