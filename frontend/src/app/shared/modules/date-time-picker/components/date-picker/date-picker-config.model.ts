import {TDrops, TOpens} from '../../types/positions.type';
import {IDayCalendarConfig, IDayCalendarConfigInternal} from '../day-calendar/day-calendar-config.model';
import {IMonthCalendarConfig, IMonthCalendarConfigInternal} from '../month-calendar/month-calendar-config';

export interface IConfig {
  closeOnSelect?: boolean;
  closeOnSelectDelay?: number;
  openOnFocus?: boolean;
  openOnClick?: boolean;
  onOpenDelay?: number;
  disableKeypress?: boolean;
  appendTo?: string | HTMLElement;
  inputElementContainer?: HTMLElement | string;
  drops?: TDrops;
  opens?: TOpens;
  hideInputContainer?: boolean;
}

export interface IDatePickerConfig extends IConfig,
                                           IDayCalendarConfig,
                                           IMonthCalendarConfig
                                           {

}

export interface IDatePickerConfigInternal extends IConfig,
                                                   IDayCalendarConfigInternal,
                                                   IMonthCalendarConfigInternal
                                                   {
}
