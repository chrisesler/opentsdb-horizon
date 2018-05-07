// define model for dashboard and submodel

export interface WidgetConfModel {
    id: string;
    title: string;
    ctype: string;
}

export interface WidgetPosModel {
    x: number;
    y: number;
    w: number;
    h: number;
    xMd: number;
    yMd: number;
}

export interface DashboadModel {
    id: string;
    title: string;
}