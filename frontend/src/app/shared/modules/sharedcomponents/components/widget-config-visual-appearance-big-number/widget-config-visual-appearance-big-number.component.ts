import { Component, OnInit, HostBinding, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import {MatMenuTrigger} from '@angular/material';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'widget-config-visual-appearance-big-number',
    templateUrl: './widget-config-visual-appearance-big-number.component.html',
    styleUrls: []
})
export class WidgetConfigVisualAppearanceBigNumberComponent implements OnInit {
    @HostBinding('class.widget-config-tab') private _hostClass = true;
    @HostBinding('class.visual-appearance-configuration-big-number') private _tabClass = true;

    /** Inputs */
    @Input() widget: any;

    /** Outputs */
    @Output() widgetChange = new EventEmitter;
    @Output() selectionChanged = new EventEmitter;

    /** Local variables */

    selectedMetric: object;
    colorType: string;

    @ViewChild(MatMenuTrigger) private menuTrigger: MatMenuTrigger;

    addTextToOpns: Array<String> = ['option 1', 'option 2', 'option 3'];
    selectedOption: string = 'no Option selected';

    stopPropagation(event){
        event.stopPropagation();
        // console.log("Clicked!");
      }
      
    onTextSelection(event: any): void {
        console.log(event);
        // if (window.getSelection && window.getSelection().toString()) {
            var menu = document.getElementById('menuBtn');
            menu.style.display = '';
            menu.style.position = 'absolute';
            // menu.style.left = event.pageX + 5 + 'px';
            // menu.style.top =  parseInt(menu.style.top, 10) - 10 + 'px'; // event.pageY + 5 + 'px';
            menu.style.left = 90 + 'px';
            menu.style.top = 165 + 'px';
            this.menuTrigger.openMenu();
        // }
    }

  onMenuClosed(): void {
    var menu = document.getElementById('menuBtn');
        if (menu) {
            menu.style.display = 'none';
        }
  }

  addTextTo(selectedOpn): void {
    this.selectedOption = selectedOpn + ' selected';
  }

    constructor() { }

    ngOnInit() {
        this.selectedMetric = this.widget;
        this.colorType = 'text'; // default color tab
    }

    // Prefix
    KeyedOnPrefixInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefix'] = value;
    }

    selectedPrefixSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefixSize'] = value;
    }

    selectedPrefixAlignment(value: string) {
        this.selectedMetric['configuration']['bigNum']['prefixAlignment'] = value;
    }

    // Postfix
    KeyedOnPostfixInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['postfix'] = value;
    }

    selectedPostfixSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['postfixSize'] = value;
    }

    selectedPostfixAlignment(value: string) {
        this.selectedMetric['configuration']['bigNum']['postfixAlignment'] = value;
    }

    // Unit
    KeyedOnUnitInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['unit'] = value;
    }

    selectedUnitSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['unitSize'] = value;
    }

    selectedUnitAlignment(value: string) {
        this.selectedMetric['configuration']['bigNum']['unitAlignment'] = value;
    }

    // Caption
    KeyedOnCaptionInputBox(value: string) {
        this.selectedMetric['configuration']['bigNum']['caption'] = value;
    }

    selectedCaptionSize(value: string) {
        this.selectedMetric['configuration']['bigNum']['captionSize'] = value;
    }

    // Precision
    KeyedOnPrecisionInputBox(value: string) {
        console.log('keyed on input box');
        this.selectedMetric['configuration']['bigNum']['precision'] = value;
    }

    // Color Picker
    selectedColorType(value: string) {
        this.colorType = value;
    }

    colorChanged(color: string) {
        if (this.colorType === 'text') {
            this.selectedMetric['configuration']['bigNum']['textColor'] = color['hex'];
        } else { // background
            this.selectedMetric['configuration']['bigNum']['backgroundColor'] = color['hex'];
        }
    }

    // Options
}
