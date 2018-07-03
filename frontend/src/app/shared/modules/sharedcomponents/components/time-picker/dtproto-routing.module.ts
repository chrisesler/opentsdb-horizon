import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Route } from '@angular/compiler/src/core';
import { TimePickerComponent } from './time-picker/time-picker.component';

const routes: Routes = [
    { path: '', redirectTo: 'dayTimeCalendarPicker2', pathMatch: 'full'},
    { path: 'dayTimeCalendarPicker2', component: TimePickerComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DtprotoRoutingModule2 {}