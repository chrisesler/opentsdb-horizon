import { Component, Input, EventEmitter, Output, ViewChild, Renderer2, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'inline-editable',
  templateUrl: './inline-editable.component.html',
  styleUrls: ['./inline-editable.component.scss']
})
export class InlineEditableComponent {

  @Input() name: string;
  @Input() fieldValue: string;
  @Input() isRequired: boolean;
  @Input() minLength: number;
  @Input() maxLength: number;
  @Output() updateValue: EventEmitter<any> = new EventEmitter();
  @ViewChild('container') container: ElementRef;

  value: any;
  isEditView: boolean = false;

  constructor(private renderer: Renderer2) { }

  showEditable() {
     this.value = this.fieldValue;
     this.isEditView = true;

    // click outside the edit zone
    this.renderer.listen('document', 'click', (event) => {
      if (!this.container.nativeElement.contains(event.target)) {
        this.isEditView = false;
      }
    });
  }

  save() {
    this.updateValue.emit(this.value);
    this.fieldValue = this.value;
    this.isEditView = false;
  }

  @HostListener('document:keydown', ['$event'])
  closeEditIfEscapePressed(event: KeyboardEvent) {
      const x = event.keyCode;
      if (x === 27) {
        this.isEditView = false;
      }
  }

}
