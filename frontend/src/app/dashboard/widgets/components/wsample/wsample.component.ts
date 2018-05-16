<<<<<<< HEAD
import {
  Component,
  OnInit,
  OnChanges,
  Input,
  Output,
  HostBinding,
  EventEmitter,
  SimpleChanges
} from '@angular/core';

=======
import { Component, OnInit, Input, Output, HostBinding, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
>>>>>>> 2c70789ac8ebcd6069b79ca056f783a854b679cf
import { locateHostElement } from '@angular/core/src/render3/instructions';

@Component({
  selector: 'app-wsample',
  templateUrl: './wsample.component.html',
  styleUrls: ['./wsample.component.scss']
})
export class WsampleComponent implements OnInit, OnChanges {
<<<<<<< HEAD
  @HostBinding('class.widget-panel-content') private _hostClass = true;
  @HostBinding('class.widget-edit-mode') private _editMode = false;
=======
  @HostBinding('class.widget-panel-content') private hostClass = true;
>>>>>>> 2c70789ac8ebcd6069b79ca056f783a854b679cf

  @Input() editMode: any = { 'showConfig': false } ;
  @Input() widget: any;

  constructor() { }

<<<<<<< HEAD
  ngOnInit() {
    console.log('WSAMPLE :: onInit', this);
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('***** CHANGES *******', changes);
  }

=======
  ngOnInit() { }
>>>>>>> 2c70789ac8ebcd6069b79ca056f783a854b679cf

  ngOnChanges(changes: SimpleChanges) {
    console.log(this.widget.id + ' => ' + changes);    
  }
}
