import { State } from '@ngxs/store';
import { WidgetsConfigState } from './widgets-config.state';
import { WidgetsRawdataState } from './widgets-data.state';

export interface WidgetsModel {
    ids: string[];
}

@State<WidgetsModel>({
    name: 'Widgets',
    defaults: {
        ids: []
    },
    children: [WidgetsConfigState, WidgetsRawdataState]
})

export class WidgetsState {}
