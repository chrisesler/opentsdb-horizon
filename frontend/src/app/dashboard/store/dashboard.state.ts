import { State } from '@ngxs/store';

export interface DashboardModel {
    loading: boolean;
    loaded: boolean;
    widgets: any[];
}

@State<DashboardModel>({
    name: 'dashboardState',
    defaults: {
        loaded: false,
        loading: true,
        widgets: [{}]
    }
})

export class DashboardState { }
