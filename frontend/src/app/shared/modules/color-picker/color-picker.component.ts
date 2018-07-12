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
// import { MccColorPickerCollectionComponent } from './color-picker-collection.component';
import { MccColorPickerService } from './color-picker.service';
// import { ViewChild } from '@angular/core';
import { HostListener } from '@angular/core';
import { ViewChild } from '@angular/core';
import { OnChanges } from '@angular/core/src/metadata/lifecycle_hooks';
import { MatCard } from '@angular/material';
import { MccColorPickerSelectorComponent } from './color-picker-selector.component';
// import {OverlayModule} from '@angular/cdk/overlay';

interface IColor {
  text: string;
  value: string;
}

@Component({
  selector: 'mcc-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class MccColorPickerComponent implements AfterContentInit, OnInit, OnDestroy {

  DefaultColors: IColor[] = [
    {text: "1", value: "#B00013"}, 
    {text: "2", value: "#FECF2B"}, 
    {text: "3", value: "#0B5ED2"},
    {text: "4", value: "#9971E0"},
    {text: "5", value: "#242424"}, 
    {text: "6", value: "#DA001B"}, 
    {text: "7", value: "#AAEC61"}, 
    {text: "8", value: "#B0D9F9"},
    {text: "9", value: "#300075"},
    {text: "10", value: "#4D4D4D"}, 
    {text: "11", value: "#ED5A1C"}, 
    {text: "12", value: "#75D42A"}, 
    {text: "13", value: "#18BDED"},
    {text: "14", value: "#B10060"},
    {text: "15", value: "#888888"}, 
    {text: "16", value: "#ECA024"}, 
    {text: "17", value: "#1CB84F"}, 
    {text: "18", value: "#18BDED"},
    {text: "19", value: "#FB007D"},
    {text: "20", value: "#888888"}, 
    {text: "21", value: "#FECF2B"}, 
    {text: "22", value: "#446E17"}, 
    {text: "23", value: "#87119A"},
    {text: "24", value: "#FC5AA8"},
    {text: "25", value: "#FFFFFF"} ];

  /**
   * Get all collections
   */
//   @ContentChildren(MccColorPickerCollectionComponent)
//   _collections: QueryList<MccColorPickerCollectionComponent>;

  /*
  */
  selectingCustomColor: boolean = false;

  toggleSelector(){
    this.selectingCustomColor = !this.selectingCustomColor;
  }

  colorSelected(hexColor: string): void {
    this.selectedColor = hexColor;
  }

  colorToName(hexColor: string): string {
    let colorName = hexColor;
    for(let color of this.DefaultColors ) {
      if(color.value == hexColor ){
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
    this._selectedColor = coerceHexaColor(value) || this.emptyColor;
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
   * Define new height for the selector
   */
  @Input()
  get colorPickerSelectorHeight(): number {
    return this._colorPickerSelectorHeight;
  }
  set colorPickerSelectorHeight(height: number) {
    this._colorPickerSelectorHeight = height;
  }
  private _colorPickerSelectorHeight: number = 170;

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
   * Observable with all the colors used by the user
   */
//   get usedColors$(): Observable<string[]> {
//     return this.colorPickerService
//       .getColors()
//       .pipe(map(colors => (!this._reverseUsedColor ? colors : [...colors].reverse())));
//   }

  /**
   * Array of subscriptions from the collections
   */
  private _collectionSubs: Subscription[] = [];

  constructor(
    private elementRef: ElementRef,
    private changeDetectorRef: ChangeDetectorRef,
    private colorPickerService: MccColorPickerService,
    @Inject(EMPTY_COLOR) public emptyColor: string
  ) {}

  ngOnInit() {
    if (!this._selectedColor) {
      // this._selectedColor = this.emptyColor;
      this._selectedColor = "#FFFFFF";
    }

    this._tmpSelectedColor = new BehaviorSubject<string>(this._selectedColor);
  }

  /**
   * Walk throw all collections and subcribe to changes
   */
  ngAfterContentInit() {
    // if (this._collections) {
    //   this._collections.forEach((collection: MccColorPickerCollectionComponent) => {
    //     const subscription = collection.changeColor.subscribe(color => {
    //       this.updateTmpSelectedColor(color);
    //     });

    //     this._collectionSubs.push(subscription);
    //   });
    // }
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
        this.selected.emit(this._selectedColor);
      }
    }
  }

  /**
   * Open/close color picker panel
   */
  toggle() {
    this._isOpen = !this._isOpen;
    if (!this._isOpen && this._selectedColor !== this.emptyColor) {
      this.colorPickerService.addColor(this._selectedColor);
    }
  }

  /**
   * Update selected color, close the panel and notify the user
   */
  backdropClick(): void {
    console.log("backdrop click");
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
    this.selected.emit(this._selectedColor);
    this.change.next(this._selectedColor);
    this.toggle();
  }

  /**
   * Update selectedColor and close the panel
   */
  confirmSelectedColor() {
    this._updateSelectedColor();
    this.toggle();
  }

}
