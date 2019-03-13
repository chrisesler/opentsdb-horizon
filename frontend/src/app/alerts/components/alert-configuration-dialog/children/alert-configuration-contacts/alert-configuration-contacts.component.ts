import { Component, OnInit, HostBinding } from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import {COMMA, ENTER} from '@angular/cdk/keycodes';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'alert-configuration-contacts',
  templateUrl: './alert-configuration-contacts.component.html',
  styleUrls: ['./alert-configuration-contacts.component.scss']
})
export class AlertConfigurationContactsComponent implements OnInit {
  @HostBinding('class.alert-configuration-contacts-component') private _hostClass = true;
  constructor() { }


  // tslint:disable:no-inferrable-types
  contactsFocused: boolean = false;
  addContact: string = 'existing';
  contactsAsString: string = '';
  lastContactName: string = '';

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  selectedContacts: any = [];
  exisitingContacts: any = [
    {
        name: 'prod',
        type: 'Group',
        isSelected: false
    },
    {
        name: 'dev-team',
        type: 'OpsGenie',
        isSelected: false
    },
    {
        name: 'yamas-devel',
        type: 'Slack',
        isSelected: false
    },
    {
        name: 'yamas-devel@verizonmedia.com',
        type: 'Email',
        isSelected: false
    }
];

  ngOnInit() {
  }


  focusFunction() {
    this.contactsFocused = true;
  }

  focusOutFunction() {
      this.contactsFocused = false;
      this.addContact = 'existing';
  }

  viewExistingContacts() {
      this.contactsFocused = true;
      this.addContact = 'existing';
  }

  addGroup() {
      this.addContact = 'group';
  }

  addSlack() {
      this.addContact = 'slack';
  }

  addOpsGenie() {
      this.addContact = 'opsgenie';
  }

  latestContactName(name: string) {
    this.lastContactName = name;
  }

  addGroupContact() {
      // tslint:disable:prefer-const
      let contact: any = {};
      contact.name = this.lastContactName;
      contact.type = 'Group';
      contact.isSelected = false;
      this.addToExistingContacts(contact);
      this.viewExistingContacts();
  }

  addOpsGenieContact() {
      let contact: any = {};
      contact.name = this.lastContactName;
      contact.type = 'OpsGenie';
      contact.isSelected = false;
      this.addToExistingContacts(contact);
      this.viewExistingContacts();
  }

  addSlackContact() {
      let contact: any = {};
      contact.name = this.lastContactName;
      contact.type = 'Slack';
      contact.isSelected = false;
      this.addToExistingContacts(contact);
      this.viewExistingContacts();
  }

  addEmailContact(email: string, isSelected): any {
    let contact: any = {};
    contact.name = email;
    contact.type = 'Email';
    contact.isSelected = isSelected;
    this.addToExistingContacts(contact);
    return contact;
  }

  addToExistingContacts(contact: any) {
    // contact.isSelected = false;
    this.exisitingContacts.push(contact);
}

  getGroupContacts(): any[] {
      // console.log(this.getContacts('Group'));
      return this.getContacts('Group');
  }

  getOpsGenieContacts(): any[] {
      return this.getContacts('OpsGenie');
  }

  getEmailContacts(): any[] {
      return this.getContacts('Email');
  }

  getSlackContacts(): any[] {
      return this.getContacts('Slack');
  }

  getContacts(type: string): any[] {
      // tslint:disable:prefer-const
      let contacts = [];
      for (let contact of this.exisitingContacts) {
          if (contact.type === type) {
              contacts.push(contact);
          }
      }
      return contacts;
  }

  addContactToSelectedContacts(contact: any) {
    this.addContactFromName(contact.name);
  }

  addContactFromName(contactName: string) {
    let isExistingContact: boolean = false;

    for (let _contact of this.exisitingContacts) {
      if (_contact.name === contactName) {
        _contact.isSelected = true;
        this.selectedContacts.push(_contact);
        isExistingContact = true;
        break;
      }
    }

    if (!isExistingContact) {
      this.selectedContacts.push(this.addEmailContact(contactName, true));
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

  removeFromSelectedContacts(contact: any) {
    const index = this.selectedContacts.indexOf(contact);
    if (index >= 0) {
      this.selectedContacts.splice(index, 1);
    }
    this.setContactAsSelected(contact, false);
  }

  setContactAsSelected(contact: any, isSelected) {
    for (let _contact of this.exisitingContacts) {
      if (_contact.name === contact.name && _contact.type === contact.type) {
          _contact.isSelected = isSelected;
      }
    }
  }

}
