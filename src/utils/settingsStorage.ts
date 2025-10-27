// Temporary compatibility wrapper - DO NOT USE FOR NEW CODE
// Use SettingsContext instead
import { CompanySettings, defaultSettings } from '@/types/settings';

export const loadSettings = (): CompanySettings => {
  console.warn('loadSettings() is deprecated. Use useSettings() hook instead.');
  return defaultSettings;
};

export const saveSettings = (settings: CompanySettings): void => {
  console.warn('saveSettings() is deprecated. Use useSettings() hook instead.');
};
