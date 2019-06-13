import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

import { LoggerService } from '../../../../core/services/logger.service';

import { DbfsFileModel, DbfsFolderModel, DbfsUserModel, DbfsNamespaceModel } from '../state/dbfs-resources.state';

@Injectable()
export class DbfsUtilsService {

    constructor(
        private logger: LoggerService
    ) { }

    

}
