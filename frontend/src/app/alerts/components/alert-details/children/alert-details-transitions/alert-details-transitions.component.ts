import { Component, OnInit, Input, Output } from '@angular/core';
import { EventEmitter } from 'events';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'alert-details-transitions',
  templateUrl: './alert-details-transitions.component.html',
  styleUrls: []
})
export class AlertDetailsTransitionsComponent implements OnInit {

  constructor() { }

  @Input() allowWarn: boolean;
  @Input() allowComposite: boolean;
  @Input() allowUnknown: boolean;

  @Input() selectedTransitions;
  @Input() disabledTransitions;

  @Output() newEnabledTransitions = new EventEmitter();

  transitionToLabel = {
    'GoodToBad' : 'Good to Bad',
    'BadToGood' : 'Bad to Good',
    'WarnToGood' : 'Warn to Good',
    'WarnToBad' : 'Warn to Bad',
    'GoodToWarn' : 'Good to Warn',
    'BadToWarn' : 'Bad to Warn',
    'GoodToGood' : 'Good to Good',
    'BadToBad' : 'Bad to Bad',
    'BadToUnknown' : 'Bad to Unknown',
    'UnknownToBad' : 'Unknown to Bad',
    'GoodToUnknown' : 'Good to Unknown',
    'UnknownToGood' : 'Unknown to Good',
    'WarnToUnknown' : 'Warn to Unknown',
    'UnknownToWarn' : 'Unknown to Warn'
  };

  baseTransitions = ['GoodToBad', 'BadToGood'];
  warnTransitions = ['WarnToGood', 'WarnToBad', 'GoodToWarn', 'BadToWarn'];
  compositeTransitions = ['GoodToGood', 'BadToBad'];
  unknownTransitions = ['BadToUnknown', 'UnknownToBad', 'GoodToUnknown', 'UnknownToGood'];
  warnUnknownTransitions = ['WarnToUnknown', 'UnknownToWarn'];

  possibleTransitions = [];

  ngOnInit() {

    if (!this.selectedTransitions) {
      this.selectedTransitions = [];
    }

    if (!this.disabledTransitions) {
      this.disabledTransitions = [];
    }

    this.addTransitions(this.baseTransitions);

    if (this.allowWarn) {
      this.addTransitions(this.warnTransitions);
    }

    if (this.allowComposite) {
      this.addTransitions(this.allowComposite);
    }

    if (this.allowUnknown) {
      this.addTransitions(this.unknownTransitions);
    }

    if (this.allowWarn && this.allowUnknown) {
      this.addTransitions(this.warnUnknownTransitions);
    }
  }

  addTransitions(transitions) {
    for (const transition of transitions) {
      this.possibleTransitions.push(transition);
    }
  }

  isDisabled(transition): boolean {
    return this.disabledTransitions.includes(transition);
  }

  isSelected(transition): boolean {
    return this.selectedTransitions.includes(transition);
  }

  selectionChanged(transition) {
    this.toggleTransition(transition);
    this.newEnabledTransitions.emit(this.selectedTransitions);
  }

  toggleTransition(transition) {
    if (this.isSelected(transition)) {
      for (let i = 0; i < this.selectedTransitions.length; i++) {
        if (this.selectedTransitions[i] === transition) {
          this.selectedTransitions.splice(i, 1);
        }
      }
    } else {
      this.selectedTransitions.push(transition);
    }
  }

}
