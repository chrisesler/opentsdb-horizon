export class DBNAVloadNavResources {
    public static type = '[DashboardNavigator] Get User Resource Data';
    constructor() {}
}

export class DBNAVloadNavResourcesSuccess {
    static readonly type = '[DashboardNavigator] Get User Resource Data [SUCCESS]';
    constructor(public readonly response: any) {}
}

export class DBNAVloadNavResourcesFail {
    static readonly type = '[DashboardNavigator] Get User Resource Data [FAIL]';
    constructor(public readonly error: any) { }
}

// -- GET SUBFOLDERS/FILES OF FOLDER -- //
export class DBNAVloadSubfolder {
    static readonly type = '[DashboardNavigator] Get Subfolder';
    constructor(public readonly path: string) {}
}

export class DBNAVloadSubfolderSuccess {
    static readonly type = '[DashboardNavigator] Get Subfolder [SUCCESS]';
    constructor(public readonly path: string) {}
}

export class DBNAVloadSubfolderFail {
    static readonly type = '[DashboardNavigator] Get Subfolder [FAIL]';
    constructor(public readonly path: string) {}
}

// -- CREATE FOLDER -- //

export class DBNAVcreateFolder {
    static readonly type = '[DashboardNavigator] Create Folder';
    constructor() {}
}
export class DBNAVcreateFolderSuccess {
    static readonly type = '[DashboardNavigator] Create Folder [SUCCESS]';
    constructor() {}
}
export class DBNAVcreateFolderFail {
    static readonly type = '[DashboardNavigator] Create Folder [FAIL]';
    constructor() {}
}

// -- UPDATE FOLDER -- //

export class DBNAVupdateFolder {
    static readonly type = '[DashboardNavigator] Update Folder';
    constructor() {}
}
export class DBNAVupdateFolderSuccess {
    static readonly type = '[DashboardNavigator] Update Folder [SUCCESS]';
    constructor() {}
}
export class DBNAVupdateFolderFail {
    static readonly type = '[DashboardNavigator] Update Folder [FAIL]';
    constructor() {}
}

// -- MOVE FOLDER -- //

export class DBNAVmoveFolder {
    static readonly type = '[DashboardNavigator] Move Folder';
    constructor() {}
}
export class DBNAVmoveFolderSuccess {
    static readonly type = '[DashboardNavigator] Move Folder [SUCCESS]';
    constructor() {}
}
export class DBNAVmoveFolderFail {
    static readonly type = '[DashboardNavigator] Move Folder [FAIL]';
    constructor() {}
}

// -- CREATE FILE -- //

export class DBNAVcreateFile {
    static readonly type = '[DashboardNavigator] Create File';
    constructor() {}
}
export class DBNAVcreateFileSuccess {
    static readonly type = '[DashboardNavigator] Create File [SUCCESS]';
    constructor() {}
}
export class DBNAVcreateFileFail {
    static readonly type = '[DashboardNavigator] Create File [FAIL]';
    constructor() {}
}

// -- UPDATE FILE -- //

export class DBNAVupdateFile {
    static readonly type = '[DashboardNavigator] Update File';
    constructor() {}
}
export class DBNAVupdateFileSuccess {
    static readonly type = '[DashboardNavigator] Update File [SUCCESS]';
    constructor() {}
}
export class DBNAVupdateFileFail {
    static readonly type = '[DashboardNavigator] Update File [FAIL]';
    constructor() {}
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
