import {
    State,
    StateContext,
    Store,
    Action,
    Selector,
    createSelector
} from '@ngxs/store';

import { environment } from '../../../../../environments/environment';

import { LoggerService } from '../../../../core/services/logger.service';
import { UtilsService } from '../../../../core/services/utils.service';

import {
    map,
    tap,
    catchError,
    reduce
} from 'rxjs/operators';

import { DBNAVPanelsState } from './dbnav-panels.state';

/** Interfaces */
export interface DBNAVStateModell {
    user: {
        userid: any;
        name: string;
        memberNamespaces: any[]
    };
    loading: boolean;
    error: {};
    panelAction: {};
}


/** Actions */


// Default model
@State<DBNAVStateModell>({
    name: 'DBNAV',
    defaults: {
        user: {
            userid: '',
            name: '',
            memberNamespaces: []
        },
        loading: false,
        error: {},
        panelAction: {}
    },
    children: [ DBNAVPanelsState ]
})

// state
export class DBNAVState {

    constructor (
        private logger: LoggerService,
        // private navService: DashboardNavigatorService,
        private store: Store,
        private util: UtilsService
    ) {}
}