import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompanySettings, defaultSettings } from '@/types/settings';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from './CompanyContext';

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
  const { activeCompany } = useCompany();

  const loadSettings = async () => {
    try {
      if (!activeCompany) {
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', activeCompany.id)
        .maybeSingle();

      if (error) {
        console.error('Failed to load settings:', error);
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }

      if (!data) {
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }

      setSettings({
        companyName: data.company_name,
        companyType: data.company_type as CompanySettings['companyType'],
        email: data.email,
        phone: data.phone,
        address: data.address,
        website: '',
        country: data.country as CompanySettings['country'],
        taxRate: Number(data.tax_rate),
        currency: data.currency,
        currencySymbol: data.currency_symbol,
        logoUrl: data.logo_url,
        primaryColor: '#3b82f6',
        financialYearEndMonth: 12,
        vatNumber: data.tax_number,
        companyRegistrationNumber: data.registration_number,
        invoicePrefix: data.invoice_prefix,
        invoiceStartNumber: data.invoice_start_number,
        quotePrefix: data.quote_prefix,
        quoteStartNumber: data.quote_start_number,
        purchasePrefix: data.purchase_prefix,
        purchaseStartNumber: data.purchase_start_number,
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(defaultSettings);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [activeCompany]);

  const saveSettings = async (newSettings: CompanySettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeCompany) throw new Error('User not authenticated or no active company');

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: user.id,
          company_id: activeCompany.id,
          company_name: newSettings.companyName,
          company_type: newSettings.companyType,
          email: newSettings.email,
          phone: newSettings.phone,
          address: newSettings.address,
          city: '',
          state: '',
          postal_code: '',
          country: newSettings.country,
          tax_number: newSettings.vatNumber || '',
          registration_number: newSettings.companyRegistrationNumber || '',
          tax_rate: newSettings.taxRate,
          currency: newSettings.currency,
          currency_symbol: newSettings.currencySymbol,
          logo_url: newSettings.logoUrl,
          invoice_prefix: newSettings.invoicePrefix || 'INV',
          invoice_start_number: newSettings.invoiceStartNumber || 1,
          quote_prefix: newSettings.quotePrefix || 'QTE',
          quote_start_number: newSettings.quoteStartNumber || 1,
          purchase_prefix: newSettings.purchasePrefix || 'PO',
          purchase_start_number: newSettings.purchaseStartNumber || 1,
          financial_year_end: '12-31',
        }, {
          onConflict: 'user_id,company_id'
        });

      if (error) throw error;
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, saveSettings, refreshSettings: loadSettings }}>
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
