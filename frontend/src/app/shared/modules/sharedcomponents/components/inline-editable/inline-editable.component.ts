import { Component, Input, EventEmitter, Output, ViewChild, Renderer2, ElementRef, HostListener, HostBinding } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';

@Component({
  selector: 'inline-editable',
  templateUrl: './inline-editable.component.html',
  styleUrls: []
})

export class InlineEditableComponent implements OnInit {
  @HostBinding('class.inline-editable') private _hostClass = true;

  @Input() fieldValue: string;
  @Input() minLength: number;
  @Input() maxLength: number;
  @Output() updateValue: EventEmitter<any> = new EventEmitter();
  @ViewChild('container') container: ElementRef;

  isRequired: boolean = true;
  isEditView: boolean = false;
  fieldFormControl: FormControl;

  constructor(private renderer: Renderer2) { }

  ngOnInit() {

    if (!this.fieldValue || this.fieldValue.trim().length === 0) {
      this.fieldValue = 'placeholder';
    }

    this.fieldFormControl = new FormControl('', []);
    this.fieldFormControl.setValue(this.fieldValue);
    let validators: any[] = new Array;
    validators.push(Validators.required, this.noWhitespaceValidator);

    if (this.minLength) {
      validators.push(Validators.minLength(this.minLength));
    }
    if (this.maxLength) {
      validators.push(Validators.maxLength(this.maxLength));
    }
    this.fieldFormControl.setValidators(validators);
  }

  noWhitespaceValidator(control: FormControl) {
    const isWhitespace = (control.value || '').trim().length === 0;
    const isValid = !isWhitespace;
    return isValid ? null : { 'whitespace': true };
  }

  showEditable() {
    this.isEditView = true;

     // click outside the edit zone
    this.renderer.listen('document', 'click', (event) => {
      if (!this.container.nativeElement.contains(event.target)) {
        this.resetFormField();
      }
    });
  }

  save() {
    if (!this.fieldFormControl.errors) {
      this.updateValue.emit(this.fieldFormControl.value);
      this.fieldValue = this.fieldFormControl.value;
      this.isEditView = false;
    }
  }

  resetFormField() {
    this.isEditView = false;
    this.fieldFormControl.setValue(this.fieldValue);
  }

  @HostListener('document:keydown', ['$event'])
  closeEditIfEscapePressed(event: KeyboardEvent) {
    const x = event.keyCode;
    if (x === 27) {
      this.resetFormField();
    }
  }
}
