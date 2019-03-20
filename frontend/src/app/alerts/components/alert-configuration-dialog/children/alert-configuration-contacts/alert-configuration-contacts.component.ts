import { Component, OnInit, HostBinding, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Mode, RecipientType, Recipient } from './models';
import { FormControl } from '@angular/forms';

@Component({
  // tslint:disable:no-inferrable-types
  // tslint:disable:prefer-const
  // tslint:disable-next-line:component-selector
  selector: 'alert-configuration-contacts',
  templateUrl: './alert-configuration-contacts.component.html',
  styleUrls: ['./alert-configuration-contacts.component.scss']
})

export class AlertConfigurationContactsComponent implements OnInit {
  @HostBinding('class.alert-configuration-contacts-component') private _hostClass = true;
  constructor(private eRef: ElementRef) { }

  @Input() namespace: string;
  @Input() alertRecipients: any; // [{name, type}]
  @Output() updatedAlertRecipients = new EventEmitter<any>(); // [{name, type}]

  megaPanelVisible: boolean = false;
  viewMode: Mode = Mode.all;
  recipientType: RecipientType = RecipientType.OpsGenie;
  recipients: {}; // map<RecipientType, Recipient>;
  tempRecipient: Recipient; // for canceling
  namespaceRecipients: any = [
    {
      name: 'dev-team',
      type: RecipientType.OpsGenie,
      priority: 'P4',
      apiKey: 'xyz',
      tags: 'User-Facing'
    },
    {
      name: 'yamas-devel',
      type: RecipientType.Slack,
      webhook: 'http://slackwebhook.com/'
    },
    {
      name: 'yamas-devel@verizonmedia.com',
      type: RecipientType.Email
    },
    {
      name: 'zb@verizonmedia.com',
      type: RecipientType.Email,
      isAdmin: true
    },
    {
      name: 'OC Red',
      type: RecipientType.OC,
      displayCount: '',
      context: '',
      opsDBProperty: '',
      severity: '5'
    },
    {
      name: 'curveball',
      type: RecipientType.HTTP,
      endpoint: 'https://myendpoint.com/api/curveball'
    }
  ];
  _mode = Mode; // for template
  _recipientType = RecipientType; // for template
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];


  // form control
  opsGenieName = new FormControl('');
  opsGenieKey = new FormControl('');
  slackName = new FormControl('');
  slackWebhook = new FormControl('');
  ocName = new FormControl('');
  ocDisplayCount = new FormControl('');
  ocContext = new FormControl('');
  ocProperty = new FormControl('');
  httpName = new FormControl('');
  httpEndpoint = new FormControl('');

  anyErrors(): boolean {
    // todo - check if name is equivalent to any other within type

    if (this.recipientType === RecipientType.OpsGenie) {
      if (this.opsGenieName.errors || this.opsGenieKey.errors) {
        return true;
      }
    } else if (this.recipientType === RecipientType.Slack ) {
      if (this.slackName.errors || this.slackWebhook.errors) {
        return true;
      }
    } else if (this.recipientType === RecipientType.HTTP ) {
      if (this.httpName.errors || this.httpEndpoint.errors) {
        return true;
      }
    } else if (this.recipientType === RecipientType.OC ) {
      if (this.ocName.errors || this.ocDisplayCount.errors || this.ocContext.errors || this.ocProperty.errors) {
        return true;
      }
    }
    return false;
  }

  ngOnInit() {
    this.populateEmptyRecipients();
    if (!this.alertRecipients) {
      this.alertRecipients = [];
    }
    if (!this.namespace) {
      this.namespace = '';
    }
  }

  showMegaPanel() {
    this.megaPanelVisible = true;
  }

  collapseMegaPanel() {
    this.megaPanelVisible = false;
  }

  changeRecipientTypeForCreating(type) {
    this.recipientType = type ;
  }

  setViewMode($event: Event, mode: Mode ) {
    if ($event) {
      $event.stopPropagation();
    }

    if (mode === Mode.createRecipient) {
      this.populateEmptyRecipients();
      this.recipientType = RecipientType.OpsGenie;
    }

    if (mode === Mode.editRecipient) {
      this.tempRecipient = { ...this.recipients[this.recipientType]};
    }

    this.viewMode = mode;
  }

  editRecipientMode($event, name: string, type: RecipientType) {
    // tslint:disable-next-line:prefer-const
    let recipient = this.getRecipient(name, type);
    this.recipientType = recipient.type;
    this.recipients[this.recipientType] = recipient;

    if (this.recipientType === RecipientType.Email) {
      // do nothing
    } else {
      this.setViewMode($event, Mode.editRecipient);
    }
  }

  emitAlertRecipients() {
    this.updatedAlertRecipients.emit(this.alertRecipients);
  }

  addToNamespaceRecipients(recipient: Recipient) {
    this.namespaceRecipients.push(recipient);
  }

  addRecipientFromName(recipientName: string) {
    let isNamespaceRecipient: boolean = false;

    for (let recipient of this.namespaceRecipients) {
      if (isNamespaceRecipient && recipient.name === recipientName) {
        // TODO: two contacts same name, manually select
      }
      if (recipient.name === recipientName) {
        this.addRecipientToAlertRecipients(null, recipient.name, recipient.type);
        isNamespaceRecipient = true;
      }
    }

    if (!isNamespaceRecipient) {
      if (this.isEmailValid(recipientName)) {
        let recipient = this.createEmailRecipient(recipientName);
        this.addRecipientToAlertRecipients(null, recipient.name, recipient.type);
      } else {
      // TODO: error - invalid email or no matching contacts
      }
    }
  }

  addUserInputToAlertRecipients(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.addRecipientFromName(value);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  // OPERATIONS to get Recipient
  isAlertRecipient(name: string, type: RecipientType): boolean {
    for (let i = 0; i < this.alertRecipients.length; i++) {
      if (this.alertRecipients[i].name === name && this.alertRecipients[i].type === type) {
        return true;
      }
    }
    return false;
  }

  getRecipient(name: string, type: RecipientType): Recipient {
    for (let i = 0; i < this.namespaceRecipients.length; i++) {
      if (this.namespaceRecipients[i].name === name && this.namespaceRecipients[i].type === type) {
        return this.namespaceRecipients[i];
      }
    }
  }

  removeRecipientFromAlertRecipients(name: string, type: RecipientType) {
    for (let i = 0; i < this.alertRecipients.length; i++) {
      if (this.alertRecipients[i].name === name && this.alertRecipients[i].type === type) {
        this.alertRecipients.splice(i, 1);
        this.emitAlertRecipients();
      }
    }
  }

  removeRecipient(name: string, type: RecipientType) {
    this.removeRecipientFromAlertRecipients(name, type);
    for (let i = 0; i < this.namespaceRecipients.length; i++) {
      if (this.namespaceRecipients[i].name === name && this.namespaceRecipients[i].type === type) {
        this.namespaceRecipients.splice(i, 1);
        // todo: send server delete command
      }
    }
  }

  addRecipientToAlertRecipients($event: Event, name: string, type: RecipientType) {
    if ($event) {
      $event.stopPropagation();
    }
    if (!this.isAlertRecipient(name, type)) {
      this.alertRecipients.push({name: name, type: type});
      this.emitAlertRecipients();
    }
  }

  // User Actions
  updateRecipient(recipient: Recipient, field: string, updatedValue: string ) {
    // prepend '#' for slack
    // if (recipient.type === RecipientType.Slack && field === 'name' ) {
    //   if (updatedValue.charAt(0) !== '#') {
    //     updatedValue = '#' + updatedValue;
    //   }
    // }

    if (field === 'name') {
      for (let i = 0; i < this.alertRecipients.length; i++) {
        if (this.alertRecipients[i].name === recipient.name && this.alertRecipients[i].type === recipient.type) {
          this.alertRecipients[i].name = updatedValue;
        }
      }
    }
    recipient[field] = updatedValue;
  }

  saveCreatedRecipient($event) {
    // todo: send to server
    this.addToNamespaceRecipients(this.recipients[this.recipientType]);
    this.setViewMode($event, Mode.all);
  }

  saveEditedRecipient($event) {
    // todo: send recipient to server
    this.setViewMode($event, Mode.all);
    this.emitAlertRecipients();
  }

  testRecipient($event) {
    // todo: send to server
  }

  deleteRecipient($event: Event, recipient: Recipient)  {
    // TODO: delete contact
    this.removeRecipient(recipient.name, recipient.type);
    this.setViewMode($event, Mode.edit);
  }

  cancelEdit() {
    // reset to old contact
    for (let i = 0; i < this.namespaceRecipients.length; i++) {
      if (this.namespaceRecipients[i].name === this.recipients[this.recipientType].name &&
          this.namespaceRecipients[i].type === this.recipients[this.recipientType].type) {
        this.namespaceRecipients[i] = this.tempRecipient;
        break;
      }
    }

    for (let i = 0; i < this.alertRecipients.length; i++) {
      if (this.alertRecipients[i].name === this.recipients[this.recipientType].name &&
          this.alertRecipients[i].type === this.recipients[this.recipientType].type) {
        this.alertRecipients[i] = {name: this.tempRecipient.name, type: this.tempRecipient.type} ;
        break;
      }
    }
    this.setViewMode(null, Mode.all);
  }

  // Helpers

  populateEmptyRecipients() {
    let emptyRecipients = {};
    let emptyOpsGenieRecipient = this.createDefaultRecipient(RecipientType.OpsGenie);
    let emptySlackRecipient = this.createDefaultRecipient(RecipientType.Slack);
    let emptyHTTPRecipient = this.createDefaultRecipient(RecipientType.HTTP);
    let emptyOCRecipient = this.createDefaultRecipient(RecipientType.OC);

    // Set Defaults
    emptyOpsGenieRecipient.priority = 'P5';
    emptyOpsGenieRecipient.apiKey = '';
    emptyOpsGenieRecipient.tags = '';
    emptySlackRecipient.webhook = '';
    emptyHTTPRecipient.endpoint = '';
    emptyOCRecipient.displayCount = '';
    emptyOCRecipient.context = '';
    emptyOCRecipient.opsDBProperty = '';
    emptyOCRecipient.severity = '1';

    emptyRecipients[RecipientType.OpsGenie] = emptyOpsGenieRecipient;
    emptyRecipients[RecipientType.Slack] = emptySlackRecipient;
    emptyRecipients[RecipientType.HTTP] = emptyHTTPRecipient;
    emptyRecipients[RecipientType.OC] = emptyOCRecipient;
    this.recipients = emptyRecipients;
  }

  createDefaultRecipient(type: RecipientType ): Recipient {
    // tslint:disable-next-line:prefer-const
    let newRecipient: Recipient = {
      name: '',
      type: type,
    };
    return newRecipient;
  }

  createEmailRecipient(email: string): any {
    let recipient: any = {};
    recipient.name = email;
    recipient.type = RecipientType.Email;

    this.addToNamespaceRecipients(recipient);
    return recipient;
  }

  types(): Array<string> {
    const types = Object.keys(RecipientType);
    return types;
  }

  typesExceptEmail(): Array<string> {
    let types = Object.keys(RecipientType);
    types = types.filter(e => e !== RecipientType.Email);
    return types;
  }

  isEmailValid(email: string): boolean {
    // tslint:disable-next-line:max-line-length
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  getAllRecipientsForType(type: RecipientType) {
    return this.getRecipients(type, false);
  }

  getUnselectedRecipientsForType(type: RecipientType) {
    return this.getRecipients(type, true);
  }

  getRecipients(type: RecipientType, filterOutAlertRecipients): Recipient[] {
    // tslint:disable:prefer-const
    let recipients = [];
    for (let recipient of this.namespaceRecipients) {
      if (filterOutAlertRecipients && recipient.type === type && !this.isAlertRecipient(recipient.name, recipient.type)) {
        recipients.push(recipient);
      } else if (!filterOutAlertRecipients && recipient.type === type) {
        recipients.push(recipient);
      }
    }
    return recipients;
  }

  // Listen if we should close panel
  @HostListener('document:click', ['$event'])
  clickOutsideComponent(event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.collapseMegaPanel();
    }
  }
}
