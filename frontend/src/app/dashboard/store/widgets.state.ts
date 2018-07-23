import { State } from '@ngxs/store';

export interface WidgetsModel {
    ids: string[];
}

@State<WidgetsModel>({
    name: 'widgets',
    defaults: {
        ids: []
    }
})

export class WidgetsState {}