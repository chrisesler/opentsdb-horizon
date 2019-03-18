import { Component, OnInit, HostBinding, Renderer2, ElementRef, HostListener } from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Mode, RecipientType, Recipient } from './models';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'alert-configuration-contacts',
  templateUrl: './alert-configuration-contacts.component.html',
  styleUrls: ['./alert-configuration-contacts.component.scss']
})
export class AlertConfigurationContactsComponent implements OnInit {
  @HostBinding('class.alert-configuration-contacts-component') private _hostClass = true;
  constructor(private renderer: Renderer2, private eRef: ElementRef) { }
  // tslint:disable:no-inferrable-types
  // tslint:disable:prefer-const

  megaPanelVisible: boolean = false;
  viewMode: Mode = Mode.all;
  recipientType: RecipientType = RecipientType.OpsGenie;
  recipients: {}; // map<RecipientType, Recipient>;
  tempRecipient: Recipient; // for canceling

  selectedRecipients: any = []; // list of id's
  exisitingRecipients: any = [
    {
      id: '2',
      name: 'dev-team',
      type: RecipientType.OpsGenie,
      priority: 'P4',
      apiKey: 'xyz',
      tags: 'User-Facing'
    },
    {
      id: '3',
      name: 'yamas-devel',
      type: RecipientType.Slack,
      webhook: 'http://slackwebhook.com/'
    },
    {
      id: '4',
      name: 'yamas-devel@verizonmedia.com',
      type: RecipientType.Email
    },
    {
      id: '5',
      name: 'OC Red',
      type: RecipientType.OC
    },
    {
      id: '6',
      name: 'curveball',
      type: RecipientType.HTTP
    }
  ];

  _mode = Mode; // for template
  _recipientType = RecipientType; // for template
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  ngOnInit() {
    this.populateEmptyRecipients();
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
    }

    if (mode === Mode.editRecipient) {
      this.tempRecipient = { ...this.recipients[this.recipientType]};
    }

    this.viewMode = mode;
  }

  deleteRecipient($event: Event, recipient: Recipient)  {
    // TODO: delete contact
    this.removeRecipient(recipient.id);
    this.setViewMode($event, Mode.edit);
  }

  editRecipientMode($event, id: string) {
    // tslint:disable-next-line:prefer-const
    let recipient = this.getRecipientFromId(id);
    this.recipientType = recipient.type;
    this.recipients[this.recipientType] = recipient;

    if (this.recipientType === RecipientType.Email) {
      this.deleteRecipient($event, recipient);
    } else {
      this.setViewMode($event, Mode.editRecipient);
    }
  }

  addToExistingContacts(contact: any) {
    this.exisitingRecipients.push(contact);
  }

  addContactFromName(contactName: string) {
    let isExistingContact: boolean = false;

    for (let contact of this.exisitingRecipients) {
      if (isExistingContact && contact.name === contactName) {
        // TODO: two contacts same name, manually select
      }
      if (contact.name === contactName) {
        this.addRecipientToSelectedRecipients(null, contact.id);
        isExistingContact = true;
      }
    }

    if (!isExistingContact) {
      if (this.isEmailValid(contactName)) {
        let contact = this.createEmailContact(contactName);
        this.addRecipientToSelectedRecipients(null, contact.id);
      } else {
      // TODO: error - invalid email or no matching contacts
      }
    }
  }

  addUserInputToSelectedContacts(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.addContactFromName(value);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  isAnyContractSelected(): boolean {
    return (this.selectedRecipients.length > 0);
  }

  // OPERATIONS By ID
  isContactSelected(id: string ): boolean {
    return this.selectedRecipients.includes(id);
  }

  getRecipientFromId(id: string ): Recipient {
    for (let i = 0; i < this.exisitingRecipients.length; i++) {
      if (this.exisitingRecipients[i].id === id) {
        return this.exisitingRecipients[i];
      }
    }
  }

  removeContactFromSelectedContacts(id: string) {
    for (let i = 0; i < this.selectedRecipients.length; i++) {
      if (this.selectedRecipients[i] === id) {
        this.selectedRecipients.splice(i, 1);
      }
    }
  }

  removeRecipient(id: string) {
    this.removeContactFromSelectedContacts(id);
    for (let i = 0; i < this.exisitingRecipients.length; i++) {
      if (this.exisitingRecipients[i].id === id) {
        this.exisitingRecipients.splice(i, 1);
      }
    }
  }

  addRecipientToSelectedRecipients($event: Event, id: string) {
    if ($event) {
      $event.stopPropagation();
    }
    if (!this.selectedRecipients.includes(id)) {
      this.selectedRecipients.push(id);
    }
  }

  // User Actions

  updateRecipient(recipient: Recipient, field: string, updatedValue: string ) {

    // prepend '#' for slack
    if (recipient.type === RecipientType.Slack && field.toLowerCase() === 'name' ) {
      if (updatedValue.charAt(0) !== '#') {
        updatedValue = '#' + updatedValue;
      }
    }

    recipient[field] = updatedValue;
  }

  saveCreatedRecipient($event) {
    this.addToExistingContacts(this.recipients[this.recipientType]);
    this.setViewMode($event, Mode.all);
  }

  cancelEdit() {

    // reset to old contact
    for (let i = 0; i < this.exisitingRecipients.length; i++) {
      if (this.exisitingRecipients[i].id === this.tempRecipient.id) {
        this.exisitingRecipients[i] = this.tempRecipient;
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

    emptyRecipients[RecipientType.OpsGenie] = emptyOpsGenieRecipient;
    emptyRecipients[RecipientType.Slack] = emptySlackRecipient;
    emptyRecipients[RecipientType.HTTP] = emptyHTTPRecipient;
    emptyRecipients[RecipientType.OC] = emptyOCRecipient;
    this.recipients = emptyRecipients;
  }

  createDefaultRecipient(type: RecipientType ): Recipient {
    // tslint:disable-next-line:prefer-const
    let newRecipient: Recipient = {
      id: this.exisitingRecipients[this.exisitingRecipients.length - 1].id + 1,  // TODO: get from server,
      name: '',
      type: type,
    };
    return newRecipient;
  }

  createEmailContact(email: string): any {
    let contact: any = {};
    contact.name = email;
    contact.type = RecipientType.Email;
    contact.id = this.exisitingRecipients[this.exisitingRecipients.length - 1].id + 1;  // TODO: get from server

    this.addToExistingContacts(contact);
    return contact;
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

  getRecipients(type: RecipientType, filterOutSelectedContacts): Recipient[] {
    // tslint:disable:prefer-const
    let contacts = [];
    for (let contact of this.exisitingRecipients) {
      if (filterOutSelectedContacts && contact.type === type && !this.isContactSelected(contact.id)) {
        contacts.push(contact);
      } else if (!filterOutSelectedContacts && contact.type === type) {
        contacts.push(contact);
      }
    }
    return contacts;
  }

  // Listen if we should close panel
  @HostListener('document:click', ['$event'])
  clickOutsideComponent(event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.collapseMegaPanel();
    }
  }

}
