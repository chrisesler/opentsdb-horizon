import { Component, OnInit, HostBinding, ElementRef, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { MatChipInputEvent } from '@angular/material';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Mode, RecipientType, Recipient } from './models';
import { FormControl } from '@angular/forms';
import { Store, Select } from '@ngxs/store';
import { RecipientsState, GetRecipients, PostRecipient, DeleteRecipient, UpdateRecipient } from '../../../../state';
import { Observable } from 'rxjs';

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
  constructor(private eRef: ElementRef, private store: Store) { }

  @Input() namespace: string;
  @Input() alertRecipients: Array<any>; // [{name, type}]
  @Output() updatedAlertRecipients = new EventEmitter<Array<any>>(); // [{name, type}]

  megaPanelVisible: boolean = false;
  viewMode: Mode = Mode.all;
  recipientType: RecipientType;
  recipients: {}; // map<RecipientType, Recipient>;
  tempRecipient: Recipient; // for canceling or errors
  oldName = '';
  namespaceRecipients: any = [
    // {
    //   name: 'dev-team',
    //   type: RecipientType.opsgenie,
    //   apiKey: 'abcdefghijklmnopqrstuvwzyzzzzzzzzzzz',
    // },
    // {
    //   name: 'yamas-devel',
    //   type: RecipientType.slack,
    //   webhook: 'http://slackwebhook.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    // },
    // {
    //   name: 'yamas-devel@verizonmedia.com',
    //   type: RecipientType.email
    // },
    // {
    //   name: 'zb@verizonmedia.com',
    //   type: RecipientType.email,
    //   isAdmin: true
    // },
    // {
    //   name: 'OC Red',
    //   type: RecipientType.oc,
    //   displayCount: '1',
    //   context: 'live',
    //   opsDBProperty: 'yamas',
    // },
    // {
    //   name: 'curveball',
    //   type: RecipientType.http,
    //   endpoint: 'https://myendpoint.com/api/curveball'
    // }
  ];

  _mode = Mode; // for template
  _recipientType = RecipientType; // for template
  _clickedCreateMenu: number = 2; // needed for clicking out of menu (b/c of CDK)
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  // form control
  opsGenieName = new FormControl('');
  opsGenieApiKey = new FormControl('');
  slackName = new FormControl('');
  slackWebhook = new FormControl('');
  ocName = new FormControl('');
  ocDisplayCount = new FormControl('');
  ocContext = new FormControl('');
  ocProperty = new FormControl('');
  httpName = new FormControl('');
  httpEndpoint = new FormControl('');

  // state control
  private stateSubs: any = {};
  @Select(RecipientsState.GetRecipients) _namespaceRecipients$: Observable<any>;
  @Select(RecipientsState.GetErrors) _recipientErrors$: Observable<any>;
  // _recipients: any;

  anyErrors(): boolean {
    // todo - check if name is equivalent to any other within type

    if (this.recipientType === RecipientType.opsgenie) {
      if (this.opsGenieName.errors || this.opsGenieApiKey.errors) {
        return true;
      }
    } else if (this.recipientType === RecipientType.slack ) {
      if (this.slackName.errors || this.slackWebhook.errors) {
        return true;
      }
    } else if (this.recipientType === RecipientType.http ) {
      if (this.httpName.errors || this.httpEndpoint.errors) {
        return true;
      }
    } else if (this.recipientType === RecipientType.oc ) {
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
      this.namespace = 'Yamas';
      this.recipientType = RecipientType.opsgenie;
    }

    this.stateSubs.recipients = this._namespaceRecipients$.subscribe( data => {
      this.namespaceRecipients = [];
      // tslint:disable-next-line:forin
      for (let type in data.recipients) {
        let recipients = data.recipients[type];
        for (let _recipient of recipients) {
          _recipient.type = type.toLowerCase();
          this.namespaceRecipients.push(_recipient);
        }
      }
      if (!data.loaded) {
        this.store.dispatch(new GetRecipients(this.namespace));
      }
    });

    this.stateSubs.errors = this._recipientErrors$.subscribe( data => {
      // undo previous edit if there was an error
      this.cancelEdit(null);
    });
  }

  showMegaPanel() {
    this.megaPanelVisible = true;
  }

  collapseMegaPanel() {
    this.megaPanelVisible = false;
  }

  changeRecipientTypeForCreating($event, type) {
    if (this._clickedCreateMenu > 0) {
      this._clickedCreateMenu--;
    }
    this.recipientType = type;
    this.setViewMode($event, Mode.createRecipient);
  }

  clickedCreate() {
    this._clickedCreateMenu = 2;
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

  editRecipientMode($event, name: string, type: RecipientType) {
    // tslint:disable-next-line:prefer-const
    let recipient = this.getRecipient(name, type);
    this.recipientType = recipient.type;
    this.recipients[this.recipientType] = recipient;
    this.oldName = recipient.name;

    if (this.recipientType !== RecipientType.email) {
      this.setViewMode($event, Mode.editRecipient);
    }

    // manually update validators values
    this.opsGenieName.setValue(this.recipients[RecipientType.opsgenie].name);
    this.opsGenieApiKey.setValue(this.recipients[RecipientType.opsgenie].apikey);
    this.slackName.setValue(this.recipients[RecipientType.slack].name);
    this.slackWebhook.setValue(this.recipients[RecipientType.slack].webhook);
    this.ocName.setValue(this.recipients[RecipientType.oc].name);
    this.ocDisplayCount.setValue(this.recipients[RecipientType.oc].displaycount);
    this.ocContext.setValue(this.recipients[RecipientType.oc].context);
    this.ocProperty.setValue(this.recipients[RecipientType.oc].opsdbproperty);
    this.httpName.setValue(this.recipients[RecipientType.http].name);
    this.httpEndpoint.setValue(this.recipients[RecipientType.http].endpoint);
  }

  emitAlertRecipients() {
    this.updatedAlertRecipients.emit(this.alertRecipients);
  }

  addRecipientFromName(recipientName: string) {
    let recipient = this.getRecipientIfUniqueName(recipientName);

    if (recipient) {
      this.addRecipientToAlertRecipients(null, recipient.name, recipient.type);
    } else {
      if (this.isEmailValid(recipientName)) {
        this.recipientType = RecipientType.email;
        this.recipients[this.recipientType].name = recipientName;
        this.saveCreatedRecipient(null);
        this.addRecipientToAlertRecipients(null, this.recipients[this.recipientType].name, this.recipientType);
      }
    }
  }

  getRecipientIfUniqueName(recipientName: string) {
    let _recipient;
    let count = 0;

    for (let recipient of this.namespaceRecipients) {
      if (recipient.name === recipientName) {
        _recipient = recipient;
        count++;
      }
    }
    if (count === 1) {
      return _recipient;
    } else {
      return null;
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
    this.store.dispatch(new DeleteRecipient({namespace: this.namespace, name: name, type: type}));
    this.removeRecipientFromAlertRecipients(name, type);
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
    let newRecipient = {... this.recipients[this.recipientType]};
    newRecipient.namespace = this.namespace;
    this.store.dispatch(new PostRecipient(newRecipient));
    this.setViewMode($event, Mode.all);
  }

  saveEditedRecipient($event) {
    // check if name has changed
    let updatedRecipient: any = {};
    updatedRecipient = {... this.recipients[this.recipientType]};
    updatedRecipient.namespace = this.namespace;
    if (this.recipients[this.recipientType].name !== this.oldName) {
      updatedRecipient.name = this.oldName;
      updatedRecipient.newName = this.recipients[this.recipientType].name;
    }

    this.store.dispatch(new UpdateRecipient(updatedRecipient));
    this.setViewMode($event, Mode.all);
    this.emitAlertRecipients();
  }

  testRecipient($event) {
    // todo: send to server
  }

  deleteRecipient($event: Event, recipient: Recipient)  {
    this.removeRecipient(recipient.name, recipient.type);
    this.setViewMode($event, Mode.edit);
  }

  cancelEdit($event: Event) {
    // reset to old contact
    if (this.tempRecipient) {
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
    }
    this.setViewMode($event, Mode.all);
  }

  // Helpers

  typeToDisplayName(type: RecipientType)  {
    if (type === RecipientType.opsgenie) {
      return 'OpsGenie';
    } else if (type === RecipientType.slack) {
      return 'Slack';
    } else if (type === RecipientType.http) {
      return 'HTTP';
    } else if (type === RecipientType.oc) {
      return 'OC';
    } else if (type === RecipientType.email) {
      return 'Email';
    }
    return '';
  }

  populateEmptyRecipients() {
    let emptyRecipients = {};
    let emptyOpsGenieRecipient = this.createDefaultRecipient(RecipientType.opsgenie);
    let emptySlackRecipient = this.createDefaultRecipient(RecipientType.slack);
    let emptyHTTPRecipient = this.createDefaultRecipient(RecipientType.http);
    let emptyOCRecipient = this.createDefaultRecipient(RecipientType.oc);
    let emptyEmailRecipient = this.createDefaultRecipient(RecipientType.email);

    // Set Defaults
    emptyOpsGenieRecipient.apikey = '';
    emptySlackRecipient.webhook = '';
    emptyHTTPRecipient.endpoint = '';
    emptyOCRecipient.displaycount = '';
    emptyOCRecipient.context = '';
    emptyOCRecipient.opsdbproperty = '';
    emptyEmailRecipient.name = '';

    emptyRecipients[RecipientType.opsgenie] = emptyOpsGenieRecipient;
    emptyRecipients[RecipientType.slack] = emptySlackRecipient;
    emptyRecipients[RecipientType.http] = emptyHTTPRecipient;
    emptyRecipients[RecipientType.oc] = emptyOCRecipient;
    emptyRecipients[RecipientType.email] = emptyEmailRecipient;
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

  types(): Array<string> {
    const types = Object.keys(RecipientType);
    return types;
  }

  typesExceptEmail(): Array<string> {
    let types = Object.keys(RecipientType);
    types = types.filter(e => e !== RecipientType.email);
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
    if (!this.eRef.nativeElement.contains(event.target) && !this._clickedCreateMenu) {
      this.collapseMegaPanel();
    }
    if (this._clickedCreateMenu > 0) { // needed to exit out of menu
      this._clickedCreateMenu--;
    }
  }

}
