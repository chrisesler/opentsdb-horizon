import { Component, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @HostBinding('class.app-root') hostClass = true;
  @HostBinding('attr.data-theme') apptheme = 'dark'; // default = light theme, dark = dark theme

  title = 'app';

  selectTheme(theme: string) {
    this.apptheme = theme;
  }
}
