import  { State } from '@ngxs/store';

export interface DBSettingsModel {
    title: string;
}

@State<DBSettingsModel>({
    name: 'settings',
    defaults: {
        title: 'untitle dashboard'
    }
})

export class DBSettingsState {}