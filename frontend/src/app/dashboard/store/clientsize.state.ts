import { State } from '@ngxs/store';

export interface ClientSizeModel {
    width: number;
    height: number;
}

@State<ClientSizeModel>({
    name: 'ClientSize',
    defaults: {
        width: 120,
        height: 80
    }
})

export class ClientSizeState {}