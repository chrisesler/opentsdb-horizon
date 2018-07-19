import { Component, Input, EventEmitter, Output, ViewChild, Renderer2, ElementRef, HostListener } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';

@Component({
  selector: 'inline-editable',
  templateUrl: './inline-editable.component.html',
  styleUrls: ['./inline-editable.component.scss']
})

export class InlineEditableComponent implements OnInit {

  @Input() fieldValue: string;
  @Input() isRequired: boolean;
  @Input() minLength: number;
  @Input() maxLength: number;
  @Output() updateValue: EventEmitter<any> = new EventEmitter();
  @ViewChild('container') container: ElementRef;
  
  fieldFormControl: FormControl;
  isEditView: boolean = false;

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    this.fieldFormControl = new FormControl('', []);
    this.fieldFormControl.setValue(this.fieldValue);
    let validators: any[] = new Array;
  
    if (this.isRequired) {
      validators.push(Validators.required);
    }
    if (this.minLength) {
      validators.push(Validators.minLength(this.minLength));
    }
    if (this.maxLength) {
      validators.push(Validators.maxLength(this.maxLength));
    }
    this.fieldFormControl.setValidators(validators);
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
