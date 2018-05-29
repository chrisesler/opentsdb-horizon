import { SimpleTimePickerModule } from './simple-time-picker.module';

describe('SimpleTimePickerModule', () => {
  let simpleTimePickerModule: SimpleTimePickerModule;

  beforeEach(() => {
    simpleTimePickerModule = new SimpleTimePickerModule();
  });

  it('should create an instance', () => {
    expect(simpleTimePickerModule).toBeTruthy();
  });
});
