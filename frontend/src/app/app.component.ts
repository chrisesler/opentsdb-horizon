import { Component, OnInit, Input, HostBinding } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.scss'
  ]
})
export class AppComponent implements OnInit {
  @HostBinding('class.app-root') hostClass = true;

  title = 'app';

  constructor(private http:HttpClient) {}

  ngOnInit() {

  }

  call() {
    this.callApi();
    this.callApi();
  }
  callApi() {
  	this.http.get('/dummyapi?t=' + new Date().getTime())
      .subscribe(
        data => {
        	console.log("api call resp:",data);
        },
        err => {
        	console.log("api call error:\n",err);
        }
      );
  }

}
