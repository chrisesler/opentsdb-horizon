import { State } from '@ngxs/store';
import { DBSettingsState } from './settings.state';

export interface DBStateModel {
    id: string;
}

@State<DBStateModel>({
    name: 'dashboard',
    defaults: {
        id: 'abcdef'
    },
    children: [DBSettingsState]
})

export class DBState {

}