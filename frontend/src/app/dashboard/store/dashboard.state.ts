import { State } from '@ngxs/store';
import { DBSettingsState } from './settings.state';
import { WidgetsState } from './widgets.state';
import { ClientSizeState } from './clientsize.state';

export interface DBStateModel {
    id: string;
}

@State<DBStateModel>({
    name: 'dashboard',
    defaults: {
        id: 'abcdef'
    },
    children: [DBSettingsState, WidgetsState, ClientSizeState]
})

export class DBState {

}