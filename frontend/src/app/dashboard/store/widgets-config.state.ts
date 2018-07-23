import { State } from '@ngxs/store';

// this is just schema for what a config should be
export interface WidgetConfig {
    id: {
        gridPos: {
            x: number;
            y: number;
            w: number;
            h: number;
            xMd?: number;
            yMd?: number;
        },
        query: {
            start: string;
            end?: string;
            downsample: string;
            groups: any[];
        }
    }
}

/* the idea is hash object with id => config */

@State<any>({
    name: 'Configs',
    defaults: {}
})

export class WidgetsConfigState {}