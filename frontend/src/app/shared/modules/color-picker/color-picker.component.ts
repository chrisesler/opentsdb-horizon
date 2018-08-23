import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  QueryList,
} from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { EMPTY_COLOR, coerceHexaColor } from './color-picker';

import { ColorPickerService } from './color-picker.service';

import { HostListener, HostBinding } from '@angular/core';
import { ViewChild } from '@angular/core';
import { OnChanges } from '@angular/core/src/metadata/lifecycle_hooks';
import { MatCard } from '@angular/material';
import { ColorPickerSelectorComponent } from './color-picker-selector.component';

interface IDefaultColor {
  text: string;
  value: string;
}

interface IColor {
  hex: string;
  rgb: string;
}

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: [],
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ColorPickerComponent implements OnInit, OnDestroy {

  @HostBinding('class.cp') private _hostClass = true;

  DefaultColors: IDefaultColor[] = [
    {text: 'Maroon', value: '#B00013'},
    {text: 'Yellow', value: '#FED800'},
    {text: 'Blue', value: '#0B5ED2'},
    {text: 'Lavendar', value: '#9971E0'},
    {text: 'Black', value: '#000000'},
    {text: 'Red', value: '#DA001B'},
    {text: 'Lime', value: '#AAEC61'},
    {text: 'Periwinkle', value: '#B0D9F9'},
    {text: 'Indigo', value: '#300075'},
    {text: 'Slate Gray', value: '#4D4D4D'},
    {text: 'Orange', value: '#ED5A1C'},
    {text: 'Lime Green', value: '#75D42A'},
    {text: 'Cyan', value: '#18BDED'},
    {text: 'Magenta', value: '#B10060'},
    {text: 'Gray', value: '#888888'},
    {text: 'Brown', value: '#E28B00'},
    {text: 'Green', value: '#1CB84F'},
    {text: 'Aqua', value: '#6DDDFA'},
    {text: 'Fuchsia', value: '#FB007D'},
    {text: 'Silver', value: '#CBCBCB'},
    {text: 'Amber', value: '#F0B200'},
    {text: 'Olive', value: '#446E17'},
    {text: 'Purple', value: '#87119A'},
    {text: 'Pink', value: '#FC5AA8'},
    {text: 'White', value: '#FFFFFF'} ];

  // tslint:disable:no-inferrable-types
  selectingCustomColor: boolean = false;
  _colorPickerSelectorHeight: number = 136;

  determineIfCustomColor() {
    this.selectingCustomColor = (this.colorToName(this.selectedColor) === this.selectedColor);
  }

  toggleSelector() {
    this.selectingCustomColor = !this.selectingCustomColor;
  }

  colorSelected(hexColor: string): void {
    this.selectedColor = hexColor;
    this.change.emit(this.hexToColor(hexColor));
    this.toggle();
  }

  colorToName(hexColor: string): string {
    let colorName = hexColor;
    for (let color of this.DefaultColors) {
      if (color.value === hexColor) {
        colorName = color.text;
        break;
      }
    }
    return colorName;
  }

  /**
   * Change label of the collection UsedColors
   */
  @Input()
  get usedColorLabel(): string {
    return this._usedColorLabel;
  }
  set usedColorLabel(value: string) {
    this._usedColorLabel = value;
  }
  private _usedColorLabel: string = 'Used Colors';

  /**
   * Set initial value for used color
   */
  @Input()
  set usedColorStart(colors: string[]) {
    if (colors && colors.length > 0) {
      for (const color of colors) {
        this.colorPickerService.addColor(color);
      }
    }
  }

  /**
   * Set usedColor to be used in reverse
   */
  @Input()
  set reverseUsedColors(reverse: boolean) {
    this._reverseUsedColor = coerceBooleanProperty(reverse);
  }
  private _reverseUsedColor: boolean = false;

  /**
   * Hide the hexadecimal color forms.
   */
  @Input('hideHexForms')
  get hideHexForms(): boolean {
    return this._hideHexForms;
  }
  set hideHexForms(value: boolean) {
    this._hideHexForms = value;
  }
  private _hideHexForms: boolean = false;

  /**
   * Hide empty slots from the collection UsedColors
   */
  @Input('hideEmptyUsedColors')
  get hideEmpty(): boolean {
    return this._hideEmpty;
  }
  set hideEmpty(value: boolean) {
    this._hideEmpty = coerceBooleanProperty(value);
  }
  private _hideEmpty: boolean = false;

  /**
   * Hide transparent option of UsedColors
   */
  @Input('hideTransparentUsedColors')
  get hideTransparent(): boolean {
    return this._hideTransparent;
  }
  set hideTransparent(value: boolean) {
    this._hideTransparent = coerceBooleanProperty(value);
  }
  private _hideTransparent: boolean = false;

  /**
   * Hide UsedColors collection
   */
  @Input('hideUsedColors')
  get hideUsedColors(): boolean {
    return this._hideUsedColors;
  }
  set hideUsedColors(value: boolean) {
    this._hideUsedColors = coerceBooleanProperty(value);
  }
  private _hideUsedColors: boolean = false;

  /**
   * Start with a color selected
   */
  @Input()
  get selectedColor(): string {
    return this._selectedColor;
  }
  set selectedColor(value: string) {
 
    if (this._selectedColor !== value) {
      this.changeDetectorRef.markForCheck();
    }

    if(this.isRgbValid(value)){
      this._selectedColor = this.rgbToHex(value);
    } else {
      this._selectedColor = coerceHexaColor(value) || this.emptyColor;
    }

    this.determineIfCustomColor();
  }

  private _selectedColor: string;

  /**
   * Define if the panel will be initiated open
   */
  @Input()
  get isOpen(): boolean {
    return this._isOpen;
  }
  set isOpen(value: boolean) {
    this._isOpen = coerceBooleanProperty(value);
  }
  private _isOpen: boolean = false;

  /**
   * Define if the panel will show in overlay or not
   */
  @Input()
  get overlay(): boolean {
    return this._overlay;
  }
  set overlay(value: boolean) {
    this._overlay = coerceBooleanProperty(value);
  }
  private _overlay: boolean = true;

  /**
   * Hide the action buttons (cancel/confirm)
   */
  @Input()
  get hideButtons(): boolean {
    return this._hideButtons;
  }
  set hideButtons(value: boolean) {
    this._hideButtons = coerceBooleanProperty(value);
  }
  private _hideButtons: boolean = false;


  /**
   * Hide the color picker selector
   */
  @Input()
  get hideColorPickerSelector(): boolean {
    return this._hideColorPickerSelector;
  }
  set hideColorPickerSelector(value: boolean) {
    this._hideColorPickerSelector = coerceBooleanProperty(value);
  }
  private _hideColorPickerSelector: boolean = false;

  /**
   * Set the size of the used colors
   */
  @Input() usedSizeColors: number = 30;

  /**
   * Change btnCancel label
   */
  @Input() btnCancel: string = 'Cancel';

  /**
   * Change btnConfirm label
   */
  @Input() btnConfirm: string = 'Confirm';

  /**
   * Event emitted when user change the selected color (without confirm)
   */
  @Output() change = new EventEmitter();

  /**
   * Event emitted when selected color is confirm
   */
  @Output() selected = new EventEmitter();

  /**
   * Event emitted when is clicked outside of the component
   */
  @Output() clickOut = new EventEmitter();

  /**
   * Return a Observable with the color the user is picking
   */
  get tmpSelectedColor$(): Observable<string> {
    return this._tmpSelectedColor.asObservable();
  }
  private _tmpSelectedColor: BehaviorSubject<string>;

   /**
   * Define new height for the selector
   */
  get colorPickerSelectorHeight(): number {
    return this._colorPickerSelectorHeight;
  }
  set colorPickerSelectorHeight(height: number) {
    this._colorPickerSelectorHeight = height;
  }

  /**
   * Array of subscriptions from the collections
   */
  private _collectionSubs: Subscription[] = [];

  constructor(
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    private colorPickerService: ColorPickerService,
    @Inject(EMPTY_COLOR) public emptyColor: string
  ) {}

  ngOnInit() {
    if (!this._selectedColor) {
      this._selectedColor = '#000000';
    }

    this._tmpSelectedColor = new BehaviorSubject<string>(this._selectedColor);
  }

  /**
   * Destroy all subscriptions
   */
  ngOnDestroy() {
    if (this._collectionSubs) {
      this._collectionSubs.forEach((subscription: Subscription) => {
        if (subscription && !subscription.closed) {
          subscription.unsubscribe();
        }
      });
    }
  }

  /**
   * Update selected color and emit the change
   */
  private _updateSelectedColor() {
    if (this._isOpen || !this.overlay) {
      const tmpSelectedColor = this._tmpSelectedColor.getValue();
      if (this._selectedColor !== tmpSelectedColor) {
        this._selectedColor = tmpSelectedColor;
        this.selected.next(this._selectedColor);
      } else {
        this.selected.emit(this.hexToColor(this._selectedColor));
      }
    }
  }

  /**
   * Open/close color picker panel
   */
  toggle() {

    // if closed, determine if custom color
    if (!this._isOpen) {
      this.determineIfCustomColor();
    }
    this._isOpen = !this._isOpen;
    if (!this._isOpen && this._selectedColor !== this.emptyColor) {
      this.colorPickerService.addColor(this._selectedColor);
    }
  }

  /**
   * Update selected color, close the panel and notify the user
   */
  backdropClick(): void {
    if (this._hideButtons) {
      this.confirmSelectedColor();
    } else {
      this.cancelSelection();
    }
    this.clickOut.emit(null);
  }

  /**
   * Update tmpSelectedColor
   * @param color string
   */
  updateTmpSelectedColor(color: string) {
    if (color) {
      this._tmpSelectedColor.next(color);
      this.change.next(color);
      if (this._hideButtons) {
        this._updateSelectedColor();
      }
    }
  }

  /**
   * Cancel the selection and close the panel
   */
  cancelSelection() {
    this.toggle();
  }

  /**
   * Update selectedColor and close the panel
   */
  confirmSelectedColor() {
    this._updateSelectedColor();
    this.toggle();
  }


  /**
   * Hex and RGB conversions
   */

  hexToRgb(hex: string) {
    var bigint = parseInt(hex.substring(1), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return r + ',' + g + ',' + b;
  }

  hexToColor(_hex): IColor {
    let color = {
      hex: _hex,
      rgb: this.hexToRgb(_hex)
    }
    return color;
  }

  componentToHex(c): string {
    var hex = c.toString(16);
    var hexx = hex.length == 1 ? '0' + hex : hex; 
    return hexx;
  }

   rgbToHexHelper(r: string, g: string, b: string): string {
     return '#' + this.componentToHex(parseInt(r)) + this.componentToHex(parseInt(g)) + this.componentToHex(parseInt(b));
   }

   //ex: "20,50,70"
   rgbToHex(rgb: string){
     let values: string[] = rgb.split(',');
     if(this.isRgbValid(rgb)){
      return this.rgbToHexHelper(values[0].trim(), values[1].trim(), values[2].trim());
     }
    }
     
  //ex: "20,50,70"
  isRgbValid(rgb: string): boolean{
    let values: string[] = rgb.split(',');
    let isValid: boolean = true;
    
    if(values.length != 3){
      isValid = false;
    } else {
      for(let value of values){
        if(parseInt(value, 10) < 0 || parseInt(value, 10) > 255){
          isValid = false;
          break;
        }
      }
    }
    return isValid;
    }
}
