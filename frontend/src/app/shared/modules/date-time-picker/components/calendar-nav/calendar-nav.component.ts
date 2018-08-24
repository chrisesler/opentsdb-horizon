import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    Output,
    ViewEncapsulation
} from '@angular/core';

@Component({
    // tslint:disable-next-line:component-selector
    selector: 'dp-calendar-nav',
    templateUrl: './calendar-nav.component.html',
    encapsulation: ViewEncapsulation.None
})
export class CalendarNavComponent {
    // @HostBinding('class') @Input() theme: string;

    @Input() label: string;
    @Input() isLabelClickable: boolean = false;
    @Input() showLeftNav: boolean = true;
    @Input() showLeftSecondaryNav: boolean = false;
    @Input() showRightNav: boolean = true;
    @Input() showRightSecondaryNav: boolean = false;
    @Input() leftNavDisabled: boolean = false;
    @Input() leftSecondaryNavDisabled: boolean = false;
    @Input() rightNavDisabled: boolean = false;
    @Input() rightSecondaryNavDisabled: boolean = false;
    @Input() showGoToCurrent: boolean = true;


    // tslint:disable-next-line:no-output-on-prefix
    @Output() onLeftNav: EventEmitter<null> = new EventEmitter();
    // tslint:disable-next-line:no-output-on-prefix
    @Output() onLeftSecondaryNav: EventEmitter<null> = new EventEmitter();
    // tslint:disable-next-line:no-output-on-prefix
    @Output() onRightNav: EventEmitter<null> = new EventEmitter();
    // tslint:disable-next-line:no-output-on-prefix
    @Output() onRightSecondaryNav: EventEmitter<null> = new EventEmitter();
    // tslint:disable-next-line:no-output-on-prefix
    @Output() onLabelClick: EventEmitter<null> = new EventEmitter();
    // tslint:disable-next-line:no-output-on-prefix
    @Output() onGoToCurrent: EventEmitter<null> = new EventEmitter();

    leftNavClicked() {
        this.onLeftNav.emit();
    }

    leftSecondaryNavClicked() {
        this.onLeftSecondaryNav.emit();
    }

    rightNavClicked() {
        this.onRightNav.emit();
    }

    rightSecondaryNavClicked() {
        this.onRightSecondaryNav.emit();
    }

    labelClicked() {
        this.onLabelClick.emit();
    }
}
