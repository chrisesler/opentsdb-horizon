import { State, StateContext, Action, Selector, createSelector } from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { UtilsService } from '../../../../core/services/utils.service';

export interface DBNAVPanelModell {
    index: number;
    folderKey: string;
    folders: any[];
    files: any[];
    root?: boolean;
    personal?: any[];
    namespaces?: any[];
}

export interface DBNAVPanelsModell {
    panels: DBNAVPanelModell[];
    currentIndex: number;
}

@State<DBNAVPanelsModell>({
    name: 'Panels',
    defaults: {
        panels: [],
        currentIndex: 0
    }
})

export class DBNAVPanelsState {
    constructor(private utils: UtilsService) {}
}

