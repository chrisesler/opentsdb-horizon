import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

import { LoggerService } from '../../../../core/services/logger.service';

import { DbfsFileModel, DbfsFolderModel, DbfsUserModel, DbfsNamespaceModel, DbfsSyntheticFolderModel } from '../state/dbfs-resources.state';
import { UtilsService } from '../../../../core/services/utils.service';

@Injectable()
export class DbfsUtilsService {

    constructor(
        private logger: LoggerService,
        private utils: UtilsService
    ) { }

    findTopPath(fullPath: string) {
        const pathParts = fullPath.split('/');
        if (pathParts.length > 3) {
            pathParts.splice(3, pathParts.length);
        }
        return pathParts.join('/');
    }

    findParentPath(fullPath: string) {
        const pathParts = fullPath.split('/');
        if (pathParts.length > 3) {
            pathParts.pop();
        }
        return pathParts.join('/');
    }

    findTrashPath(fullPath: string) {
        const topPath = this.findTopPath(fullPath);
        return topPath + '/trash';
    }

    detailsByFullPath(fullPath: string) {
        const details: any = {};

        const pathParts = fullPath.split('/');
        details.type = pathParts[1];
        details.typeKey = pathParts[2];
        details.topFolder = (pathParts.length === 3);
        details.topPath = this.findTopPath(fullPath);
        details.parentPath = this.findParentPath(fullPath);
        details.trashPath = details.topPath + '/trash';
        details.fullPath = fullPath;

        return details;
    }

}
