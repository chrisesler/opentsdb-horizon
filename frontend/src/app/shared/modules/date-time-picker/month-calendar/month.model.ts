import {IDate} from '../common/models/models';

export interface IMonth extends IDate {
  currentMonth: boolean;
  disabled: boolean;
  text: string;
}
