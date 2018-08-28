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

export class ColorPickerComponent implements OnInit {
  @HostBinding('class.cp') private _hostClass = true;

  /* Inputs */

  // Behavior of the picker. Valid Values: dropDown, dropDownNoButton, embedded
  @Input() get pickerMode(): string {
    return this._pickerMode;
  }
  set pickerMode(value: string) {
    this._pickerMode = value;
  }
   _pickerMode: string;

  // Color to display
  @Input() get selectedColor(): string {
    return this._selectedColor;
  }
  set selectedColor(value: string) {
    if (this._selectedColor !== value) {
      this.changeDetectorRef.markForCheck();
    }

    if (this.isRgbValid(value)) {
      this._selectedColor = this.rgbToHex(value);
    } else {
      this._selectedColor = coerceHexaColor(value) || this.emptyColor;
    }

    // if on embedded view, do not attempt to switch between default and custom
    if (this.pickerMode !== 'embedded') {
      this.determineIfCustomColor();
    }
  }
  private _selectedColor: string;

  // Should panel be open - use with dropDownNoButton mode
  @Input() get isOpen(): boolean {
    return this._isOpen;
  }
  set isOpen(value: boolean) {
    this._isOpen = coerceBooleanProperty(value);
  }
  private _isOpen: boolean;

  /* Outputs */

  // Emitted when user changes the selected color (without apply)
  @Output() change = new EventEmitter();

  // Emitted when selected color is applied
  @Output() selected = new EventEmitter();

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

  // Valid picker modes:
  embedded = 'embedded';
  dropDownNoButton = 'dropDownNoButton';
  dropDown = 'dropDown';

  // tslint:disable:no-inferrable-types
  selectingCustomColor: boolean = false;
  _colorPickerSelectorHeight: number = 136;

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

    if (!this.pickerMode) {
      this.pickerMode = this.dropDown;
    }

    if (this.pickerMode.toLowerCase().trim() === this.embedded.toLowerCase()) {
      this.pickerMode = this.embedded;
      this.isOpen = true;
    } else if (this.pickerMode.toLowerCase().trim() === this.dropDownNoButton.toLowerCase()) {
      this.pickerMode = this.dropDownNoButton;
    } else {
      this.pickerMode = this.dropDown;
      this.isOpen = false;
    }

    this.determineIfCustomColor();
  }

  /* Picker Behaviors */
  determineIfCustomColor() {
    this.selectingCustomColor = (this.colorToName(this.selectedColor) === this.selectedColor);
  }

  toggleSelector() {
    this.selectingCustomColor = !this.selectingCustomColor;
  }

  colorSelected(hexColor: string): void {
    this.selectedColor = hexColor;
    this.change.emit(this.hexToColor(hexColor));
    // if on custom color and we hit a default color, do not switch to default view
    if (this.pickerMode !== 'embedded') {
      this.toggle();
    }
  }

  colorToName(hexColor: string): string {
    let colorName = hexColor;
    // tslint:disable-next-line:prefer-const
    for (let color of this.DefaultColors) {
      if (color.value === hexColor) {
        colorName = color.text;
        break;
      }
    }
    return colorName;
  }

  // Define selector (slider) height
  get colorPickerSelectorHeight(): number {
    return this._colorPickerSelectorHeight;
  }
  set colorPickerSelectorHeight(height: number) {
    this._colorPickerSelectorHeight = height;
  }

  // Update selected color and emit the change
  private _updateSelectedColor() {
    if (this._isOpen) {
        this.selected.emit(this.hexToColor(this._selectedColor));
    }
  }

  // Open/close color picker panel
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

  // Update selected color, close the panel and notify the user
  backdropClick(): void {
    this.cancelSelection();
  }

  // Cancel the selection and close the panel
  cancelSelection() {
    this.toggle();
  }

  // Update selectedColor and close the panel
  confirmSelectedColor() {
    this._updateSelectedColor();
    this.toggle();
  }

  /**
   * Hex and RGB conversions
   */
  // tslint:disable:no-var-keyword
  // tslint:disable:prefer-const
  // tslint:disable:no-bitwise
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
    };
    return color;
  }

  componentToHex(c): string {
    var hex = c.toString(16);
    var hexx = hex.length === 1 ? '0' + hex : hex;
    return hexx;
  }

  rgbToHexHelper(r: string, g: string, b: string): string {
    // tslint:disable-next-line:radix
    return '#' + this.componentToHex(parseInt(r)) + this.componentToHex(parseInt(g)) + this.componentToHex(parseInt(b));
  }

   // ex: "20,50,70"
  rgbToHex(rgb: string) {
    let values: string[] = rgb.split(',');
    if (this.isRgbValid(rgb)) {
      return this.rgbToHexHelper(values[0].trim(), values[1].trim(), values[2].trim());
    }
  }

  // ex: "20,50,70"
  isRgbValid(rgb: string): boolean {
    let values: string[] = rgb.split(',');
    let isValid: boolean = true;

    if (values.length !== 3) {
      isValid = false;
    } else {
      for (let value of values) {
        if (parseInt(value, 10) < 0 || parseInt(value, 10) > 255) {
          isValid = false;
          break;
        }
      }
    }
    return isValid;
  }
}
