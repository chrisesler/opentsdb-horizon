import { ThemePickerModule } from './theme-picker.module';

describe('ThemePickerModule', () => {
  let themePickerModule: ThemePickerModule;

  beforeEach(() => {
    themePickerModule = new ThemePickerModule();
  });

  it('should create an instance', () => {
    expect(themePickerModule).toBeTruthy();
  });
});
