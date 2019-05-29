import { State, StateContext, Action, Selector, createSelector } from '@ngxs/store';
import { append, patch, removeItem, updateItem } from '@ngxs/store/operators';
import { UtilsService } from '../../../../core/services/utils.service';

export interface DBNAVFolderModell {
    index: number;
    folderKey: string;
    folders: any[];
    files: any[];
    root?: boolean;
    personal?: any[];
    namespaces?: any[];
}

export interface DBNAVFoldersModell {
    folders: {};
}

@State<DBNAVFoldersModell>({
    name: 'Folders',
    defaults: {
        folders: {}
    }
})

export class DBNAVFoldersState {
    constructor(private utils: UtilsService) {}
}

