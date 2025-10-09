import { CompanySettings, defaultSettings } from '@/types/settings';
import { supabase } from '@/integrations/supabase/client';

// Migration complete. All data is now stored in Supabase backend database.
// Data persists across sessions, browsers, and devices when logged in.

export const loadSettings = async (): Promise<CompanySettings> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return defaultSettings;

    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Failed to load settings:', error);
      return defaultSettings;
    }

    if (!data) return defaultSettings;

    return {
      companyName: data.company_name,
      companyType: data.company_type,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      country: data.country,
      taxNumber: data.tax_number,
      registrationNumber: data.registration_number,
      taxRate: Number(data.tax_rate),
      currency: data.currency,
      currencySymbol: data.currency_symbol,
      logoUrl: data.logo_url,
      invoicePrefix: data.invoice_prefix,
      invoiceStartNumber: data.invoice_start_number,
      quotePrefix: data.quote_prefix,
      quoteStartNumber: data.quote_start_number,
      purchasePrefix: data.purchase_prefix,
      purchaseStartNumber: data.purchase_start_number,
      financialYearEnd: data.financial_year_end,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return defaultSettings;
  }
};

export const saveSettings = async (settings: CompanySettings): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('company_settings')
      .upsert({
        user_id: user.id,
        company_name: settings.companyName,
        company_type: settings.companyType,
        email: settings.email,
        phone: settings.phone,
        address: settings.address,
        city: settings.city,
        state: settings.state,
        postal_code: settings.postalCode,
        country: settings.country,
        tax_number: settings.taxNumber,
        registration_number: settings.registrationNumber,
        tax_rate: settings.taxRate,
        currency: settings.currency,
        currency_symbol: settings.currencySymbol,
        logo_url: settings.logoUrl,
        invoice_prefix: settings.invoicePrefix,
        invoice_start_number: settings.invoiceStartNumber,
        quote_prefix: settings.quotePrefix,
        quote_start_number: settings.quoteStartNumber,
        purchase_prefix: settings.purchasePrefix,
        purchase_start_number: settings.purchaseStartNumber,
        financial_year_end: settings.financialYearEnd,
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};
