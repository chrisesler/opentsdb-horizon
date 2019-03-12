import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
  selector: 'alert-configuration-contacts',
  templateUrl: './alert-configuration-contacts.component.html',
  styleUrls: ['./alert-configuration-contacts.component.scss']
})
export class AlertConfigurationContactsComponent implements OnInit {
  @HostBinding('class.alert-configuration-contacts-component') private _hostClass = true;
  constructor() { }


  contactsFocused: boolean = false;
  addContact: string = 'existing';
  contactsAsString: string = '';
  lastContactName: string = '';
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

  addToContacts(contact: any) {
      this.setContactAsSelected(contact, true);
      this.selectedContacts.push(contact);

      if (!this.contactsAsString) {
          this.contactsAsString = contact.name;
      } else {
          this.contactsAsString = this.contactsAsString + ', ' + contact.name;
      }
  }

  latestContactName(name: string) {
      this.lastContactName = name;

  }

  addGroupContact() {
      // tslint:disable-next-line:prefer-const
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
      // tslint:disable-next-line:prefer-const
      let contacts = [];
      // tslint:disable-next-line:prefer-const
      for (let contact of this.exisitingContacts) {
          if (contact.type === type) {
              contacts.push(contact);
          }
      }
      return contacts;
  }

  addToExistingContacts(contact: any) {
      // contact.isSelected = false;
      this.exisitingContacts.push(contact);
  }

  setContactAsSelected(contact: any, isSelected) {
      for (let _contact of this.exisitingContacts) {
          if (_contact.name === contact.name && _contact.type === contact.type) {
              _contact.isSelected = isSelected;
          }
      }
  }

  onContactChange(str: string) {
      this.contactsAsString = str;
      const contacts: string[] = str.split(',');

      for (let contact of this.exisitingContacts) {
          contact.isSelected = false;
      }

      for (let _contact of contacts) {
          for (let contact of this.exisitingContacts) {
              if (_contact.trim() === contact.name ) {
                  contact.isSelected = true;
              }
          }
      }
  }

}
