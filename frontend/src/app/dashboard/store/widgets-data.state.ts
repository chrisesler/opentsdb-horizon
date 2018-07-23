import { State } from '@ngxs/store';

/* the idea is hash table with id => groups of raw data */

@State<any>({
    name: 'Rawdata',
    defaults: {}
})

export class WidgetsRawdataState {}