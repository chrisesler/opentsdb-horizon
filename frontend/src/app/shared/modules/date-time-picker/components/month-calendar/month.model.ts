import { IDate } from '../../models/models';

export interface IMonth extends IDate {
    currentMonth: boolean;
    disabled: boolean;
    text: string;
}
