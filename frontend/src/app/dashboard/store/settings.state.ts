import  { State } from '@ngxs/store';

export interface DBSettingsModel {
    title: string;
}

@State<DBSettingsModel>({
    name: 'Settings',
    defaults: {
        title: 'untitle dashboard'
    }
})

export class DBSettingsState {}