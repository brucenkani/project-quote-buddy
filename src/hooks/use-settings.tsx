import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompanySettings, defaultSettings } from '@/types/settings';
import { loadSettings, saveSettings as saveSettingsToDb } from '@/utils/settingsStorage';

interface SettingsContextType {
  settings: CompanySettings;
  loading: boolean;
  saveSettings: (settings: CompanySettings) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    setLoading(true);
    const data = await loadSettings();
    setSettings(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const saveSettings = async (newSettings: CompanySettings) => {
    await saveSettingsToDb(newSettings);
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, saveSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
