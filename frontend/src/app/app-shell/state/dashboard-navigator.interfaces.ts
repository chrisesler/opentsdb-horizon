export interface DBNAVFile {
    id: number;
    name: string;
    path: string;
    createdTime?: number;
    createdBy?: string;
    updatedTime?: number;
    updatedBy?: string;
    type?: string;
}

export interface DBNAVFolder {
    id: number;
    name: string;
    path: string;
    resourceType: string;
    alias?: string;
    files?: DBNAVFile[];
    subfolders?: DBNAVFolder[];
    createdTime?: number;
    createdBy?: string;
    updatedTime?: number;
    updatedBy?: string;
    type?: string;
    loaded?: boolean;
    synthetic?: boolean;
}

// panel is basically a folder, but with the potential of having an icon, namespaces, or personal
export interface DBNAVPanelModel extends DBNAVFolder {
    namespaces?: DBNAVFolder[];
    personal?: DBNAVFolder[];
    icon?: string;
}

export interface DBNAVStateModel {
    user: {
        userid: string;
        name: string;
        memberNamespaces: any[];
    };
    resourceData: {
        personal: {},
        namespaces: {}
    };
    panels: DBNAVPanelModel[];
    currentPanelIndex: number;
    currentResourceType: string;
    currentNamespaceId: number;
    loading: boolean;
    loaded: boolean;
    error: any;
    status: string;
    panelAction: {};
}
