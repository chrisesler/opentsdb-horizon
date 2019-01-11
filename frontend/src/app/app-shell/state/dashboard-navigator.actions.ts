export class DBNAVloadNavResources {
    public static type = '[DashboardNavigator] Get User Resource Data';
    constructor() {}
}

export class DBNAVloadNavResourcesSuccess {
    static readonly type = '[DashboardNavigator] Get User Resource Data [SUCCESS]';
    constructor(
        public readonly response: any
    ) {}
}

export class DBNAVloadNavResourcesFail {
    static readonly type = '[DashboardNavigator] Get User Resource Data [FAIL]';
    constructor(
        public readonly error: any
    ) { }
}

// -- GET SUBFOLDERS/FILES OF FOLDER -- //
export class DBNAVloadSubfolder {
    static readonly type = '[DashboardNavigator] Get Subfolder';
    constructor(
        public readonly path: string
    ) {}
}

export class DBNAVloadSubfolderSuccess {
    static readonly type = '[DashboardNavigator] Get Subfolder [SUCCESS]';
    constructor(
        public readonly response: any
    ) {}
}

export class DBNAVloadSubfolderFail {
    static readonly type = '[DashboardNavigator] Get Subfolder [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}

// -- CREATE FOLDER -- //

export class DBNAVcreateFolder {
    static readonly type = '[DashboardNavigator] Create Folder';
    constructor(
        public readonly name: string,
        public readonly parentPath: string,
        public readonly panelIndex: number
    ) {}
}
export class DBNAVcreateFolderSuccess {
    static readonly type = '[DashboardNavigator] Create Folder [SUCCESS]';
    constructor(
        public readonly response: any,
        public panelIndex: number
    ) {}
}
export class DBNAVcreateFolderFail {
    static readonly type = '[DashboardNavigator] Create Folder [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}

// -- UPDATE FOLDER -- //

export class DBNAVupdateFolder {
    static readonly type = '[DashboardNavigator] Update Folder';
    constructor(
        public readonly id: number,
        public readonly currentPath: string,
        public readonly updates: any,
        public readonly panelIndex: number
    ) {}
}
export class DBNAVupdateFolderSuccess {
    static readonly type = '[DashboardNavigator] Update Folder [SUCCESS]';
    constructor(
        public readonly response: any,
        public readonly originalPath: string,
        public readonly panelIndex: number
    ) {}
}
export class DBNAVupdateFolderFail {
    static readonly type = '[DashboardNavigator] Update Folder [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}

// -- MOVE FOLDER -- //

export class DBNAVmoveFolder {
    static readonly type = '[DashboardNavigator] Move Folder';
    constructor(
        public readonly payloadBody: any,
        public readonly panelIndex: number
    ) {}
}
export class DBNAVmoveFolderSuccess {
    static readonly type = '[DashboardNavigator] Move Folder [SUCCESS]';
    constructor(
        public readonly response: any,
        public readonly originalPath: string,
        public readonly panelIndex: number
    ) {}
}
export class DBNAVmoveFolderFail {
    static readonly type = '[DashboardNavigator] Move Folder [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}

// -- CREATE FILE -- //

export class DBNAVcreateFile {
    static readonly type = '[DashboardNavigator] Create File';
    constructor() {}
}
export class DBNAVcreateFileSuccess {
    static readonly type = '[DashboardNavigator] Create File [SUCCESS]';
    constructor(
        public readonly response: any
    ) {}
}
export class DBNAVcreateFileFail {
    static readonly type = '[DashboardNavigator] Create File [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}

// -- UPDATE FILE -- //

export class DBNAVupdateFile {
    static readonly type = '[DashboardNavigator] Update File';
    constructor() {}
}
export class DBNAVupdateFileSuccess {
    static readonly type = '[DashboardNavigator] Update File [SUCCESS]';
    constructor(
        public readonly response: any
    ) {}
}
export class DBNAVupdateFileFail {
    static readonly type = '[DashboardNavigator] Update File [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}

// -- MOVE FILE -- //

export class DBNAVmoveFile {
    static readonly type = '[DashboardNavigator] Move File';
    constructor(
        public readonly payloadBody: any,
        public readonly panelIndex: number
    ) {}
}
export class DBNAVmoveFileSuccess {
    static readonly type = '[DashboardNavigator] Move File [SUCCESS]';
    constructor(
        public readonly response: any,
        public readonly originalPath: string,
        public readonly panelIndex: number
    ) {}
}
export class DBNAVmoveFileFail {
    static readonly type = '[DashboardNavigator] Move File [FAIL]';
    constructor(
        public readonly error: any
    ) {}
}

// -- ADD PANEL -- //
export class DBNAVaddPanel {
    static readonly type = '[DashboardNavigator] add panel';
    constructor(public readonly payload: any) {}
}

// -- GET A SPECIFIC FOLDER RESOURCE -- //
export class DBNAVgetFolderResource {
    static readonly type = '[DasboardNavigator] get folder resource';
    constructor(public readonly path: string, public readonly type: string) {}
}

// -- UPDATE PANELS -- //
export class DBNAVupdatePanels {
    static readonly type = '[DashboardNavigator] update panels';
    constructor(public readonly payload: any) {}
}
