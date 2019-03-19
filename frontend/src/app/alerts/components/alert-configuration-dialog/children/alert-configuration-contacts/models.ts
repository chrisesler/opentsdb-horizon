export enum Mode {
    all = 'ALL',
    edit = 'EDIT',
    editRecipient = 'EDITRECIPIENT',
    createRecipient = 'CREATERECIPIENT',
}

export enum RecipientType {
    OpsGenie = 'OpsGenie',
    Slack = 'Slack',
    HTTP = 'HTTP',
    OC = 'OC',
    Email = 'Email'
}

export class Recipient {
    type: RecipientType;
    name: string;
    [key: string]: any;
}
