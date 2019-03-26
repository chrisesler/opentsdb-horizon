import { Component, OnInit, HostBinding, ElementRef, HostListener, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatChipInputEvent, MatMenuTrigger, MatInput } from '@angular/material';
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

    @ViewChild('recipientMenuTrigger', {read: MatMenuTrigger }) private megaPanelTrigger: MatMenuTrigger;
    @ViewChild('recipientInput', {read: MatInput}) private recipientInput: MatInput;

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
            apiKey: 'abcdefghijklmnopqrstuvwzyzzzzzzzzzzz',
        },
        {
            name: 'yamas-devel',
            type: RecipientType.Slack,
            webhook: 'http://slackwebhook.com/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
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
            displayCount: '1',
            context: 'live',
            opsDBProperty: 'yamas',
        },
        {
            name: 'curveball',
            type: RecipientType.HTTP,
            endpoint: 'https://myendpoint.com/api/curveball'
        }
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

    /** ACCESSORS */

    get anyErrors(): boolean {
        // todo - check if name is equivalent to any other within type

        if (this.recipientType === RecipientType.OpsGenie) {
            if (this.opsGenieName.errors || this.opsGenieApiKey.errors) {
                return true;
            }
        } else if (this.recipientType === RecipientType.Slack) {
            if (this.slackName.errors || this.slackWebhook.errors) {
                return true;
            }
        } else if (this.recipientType === RecipientType.HTTP) {
            if (this.httpName.errors || this.httpEndpoint.errors) {
                return true;
            }
        } else if (this.recipientType === RecipientType.OC) {
            if (this.ocName.errors || this.ocDisplayCount.errors || this.ocContext.errors || this.ocProperty.errors) {
                return true;
            }
        }
        return false;
    }

    get viewModePanelDescriptor(): string {
        switch (this.viewMode) {
            case this._mode.edit:
                return 'Edit Recipients';
                break;
            case this._mode.editRecipient:
                return 'Edit ' + this.recipientType + ' Recipient';
                break;
            case this._mode.createRecipient:
                return 'Create ' + this.recipientType + ' Recipient';
            default:
                return 'Select Recipients';
                break;
        }
    }

    get types(): Array<string> {
        const types = Object.keys(RecipientType);
        return types;
    }

    get typesExceptEmail(): Array<string> {
        let types = Object.keys(RecipientType);
        types = types.filter(e => e !== RecipientType.Email);
        return types;
    }

    /** ANGULAR INTERFACE METHODS */

    ngOnInit() {
        this.populateEmptyRecipients();
        if (!this.alertRecipients) {
            this.alertRecipients = [];
        }
        if (!this.namespace) {
            this.namespace = '';
        }
    }

    /** METHODS */

    showMegaPanel() {
        // this.megaPanelVisible = true;
        console.log('MEGA PANEL', this.megaPanelTrigger.menu, this.recipientInput);
        this.megaPanelTrigger.openMenu();
        this.recipientInput.focus();
    }

    collapseMegaPanel() {
        // this.megaPanelVisible = false;
        this.megaPanelTrigger.closeMenu();
    }

    /** EVENTS */
    changeRecipientTypeForCreating($event, type) {
        console.log('CHANGE RECIPIENT TYPE FOR CREATING', type, $event);
        if (this._clickedCreateMenu > 0) {
            this._clickedCreateMenu--;
        }
        this.recipientType = type;
        this.setViewMode($event, Mode.createRecipient);
    }

    clickedCreate() {
        this._clickedCreateMenu = 2;
    }

    setViewMode($event: Event, mode: Mode) {
        console.log('SET VIEW MODE', $event, mode);
        if ($event) {
            $event.stopPropagation();
        }

        if (mode === Mode.createRecipient) {
            this.populateEmptyRecipients();
            //this.recipientType = RecipientType.OpsGenie;
        }

        if (mode === Mode.editRecipient) {
            this.tempRecipient = { ...this.recipients[this.recipientType] };
        }

        // for hiding/showing of backdrop dimmer when in edit mode
        let backdropEl: any;
        if (mode !== Mode.all) {
            backdropEl = document.querySelector('.mega-panel-cdk-backdrop');
            if (backdropEl && !backdropEl.classList.contains('is-dim')) {
                backdropEl.classList.add('is-dim');
            }
        } else {
            backdropEl = document.querySelector('.mega-panel-cdk-backdrop');
            if (backdropEl && backdropEl.classList.contains('is-dim')) {
                backdropEl.classList.remove('is-dim');
            }
        }

        this.viewMode = mode;
    }

    editRecipientMode($event, name: string, type: RecipientType) {
        // tslint:disable-next-line:prefer-const
        let recipient = this.getRecipient(name, type);
        this.recipientType = recipient.type;
        this.recipients[this.recipientType] = recipient;

        if (this.recipientType !== RecipientType.Email) {
            this.setViewMode($event, Mode.editRecipient);
        }

        // manually update validators values
        this.opsGenieName.setValue(this.recipients[RecipientType.OpsGenie].name);
        this.opsGenieApiKey.setValue(this.recipients[RecipientType.OpsGenie].apiKey);
        this.slackName.setValue(this.recipients[RecipientType.Slack].name);
        this.slackWebhook.setValue(this.recipients[RecipientType.Slack].webhook);
        this.ocName.setValue(this.recipients[RecipientType.OC].name);
        this.ocDisplayCount.setValue(this.recipients[RecipientType.OC].displayCount);
        this.ocContext.setValue(this.recipients[RecipientType.OC].context);
        this.ocProperty.setValue(this.recipients[RecipientType.OC].opsDBProperty);
        this.httpName.setValue(this.recipients[RecipientType.HTTP].name);
        this.httpEndpoint.setValue(this.recipients[RecipientType.HTTP].endpoint);
    }

    addRecipientToAlertRecipients($event: Event, name: string, type: RecipientType) {
        if ($event) {
            $event.stopPropagation();
        }
        if (!this.isAlertRecipient(name, type)) {
            this.alertRecipients.push({ name: name, type: type });
            this.emitAlertRecipients();
        }
    }

    addUserInputToAlertRecipients($event: MatChipInputEvent) {
        const input = $event.input;
        const value = $event.value;

        if ((value || '').trim()) {
            this.addRecipientFromName(value);
        }

        // Reset the input value
        if (input) {
            input.value = '';
        }
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

    deleteRecipient($event: Event, recipient: Recipient) {
        $event.stopPropagation();
        // TODO: delete contact
        this.removeRecipient(recipient.name, recipient.type);
        this.setViewMode($event, Mode.edit);
    }

    cancelEdit($event: Event) {
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
                this.alertRecipients[i] = { name: this.tempRecipient.name, type: this.tempRecipient.type };
                break;
            }
        }
        this.setViewMode($event, Mode.all);
    }

    // when contact menu is closed, need to reset some things
    contactMenuClosed($event: any) {
        // console.log('CONTACT MENU CLOSED', $event);
        if (this.viewMode !== Mode.all) {
            this.viewMode = Mode.all;
            if (this._clickedCreateMenu > 0) { // needed to exit out of menu
                this._clickedCreateMenu--;
            }
        }
    }

    /** METHODS */

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

    // User Actions
    updateRecipient(recipient: Recipient, field: string, updatedValue: string) {

        if (field === 'name') {
            for (let i = 0; i < this.alertRecipients.length; i++) {
                if (this.alertRecipients[i].name === recipient.name && this.alertRecipients[i].type === recipient.type) {
                    this.alertRecipients[i].name = updatedValue;
                }
            }
        }
        recipient[field] = updatedValue;
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

    createDefaultRecipient(type: RecipientType): Recipient {
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


    // NOTE: Not sure we need this any more
    // Listen if we should close panel
    @HostListener('document:click', ['$event'])
    clickOutsideComponent(event) {
        /*if (!this.eRef.nativeElement.contains(event.target) && !this._clickedCreateMenu) {
            this.collapseMegaPanel();
        }
        if (this._clickedCreateMenu > 0) { // needed to exit out of menu
            this._clickedCreateMenu--;
        }*/
    }

}
