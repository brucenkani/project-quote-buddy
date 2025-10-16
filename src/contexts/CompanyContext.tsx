import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CompanySettings {
  company_name: string;
  country: string;
  company_type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  tax_number: string;
  registration_number: string;
  currency: string;
  currency_symbol: string;
  logo_url?: string;
  tax_rate: number;
  financial_year_end: string;
  invoice_prefix: string;
  invoice_start_number: number;
  quote_prefix: string;
  quote_start_number: number;
  purchase_prefix: string;
  purchase_start_number: number;
}

interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'accountant' | 'employee';
  joined_at: string;
}

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  activeCompanySettings: CompanySettings | null;
  setActiveCompany: (company: Company | null) => void;
  createCompany: (name: string, settings: Partial<CompanySettings>) => Promise<Company | null>;
  updateCompany: (companyId: string, name: string, settings?: Partial<CompanySettings>) => Promise<boolean>;
  deleteCompany: (companyId: string) => Promise<boolean>;
  updateCompanySettings: (companyId: string, settings: Partial<CompanySettings>) => Promise<boolean>;
  loading: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [activeCompanySettings, setActiveCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCompanySettings = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setActiveCompanySettings(data || null);
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCompanies([]);
        setActiveCompanyState(null);
        setLoading(false);
        return;
      }

      // Get all companies the user is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setCompanies([]);
        setActiveCompanyState(null);
        setLoading(false);
        return;
      }

      const companyIds = memberData.map(m => m.company_id);

      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds)
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      setCompanies(companiesData || []);

      // Set active company from localStorage or first company
      const savedCompanyId = localStorage.getItem('activeCompanyId');
      if (savedCompanyId && companiesData?.find(c => c.id === savedCompanyId)) {
        setActiveCompanyState(companiesData.find(c => c.id === savedCompanyId) || companiesData[0] || null);
      } else {
        setActiveCompanyState(companiesData?.[0] || null);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const setActiveCompany = async (company: Company | null) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem('activeCompanyId', company.id);
      await loadCompanySettings(company.id);
    } else {
      localStorage.removeItem('activeCompanyId');
      setActiveCompanySettings(null);
    }
  };

  const createCompany = async (name: string, settings: Partial<CompanySettings>): Promise<Company | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a company',
          variant: 'destructive',
        });
        return null;
      }

      // Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({ name, created_by: user.id })
        .select()
        .single();

      if (companyError) throw companyError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: companyData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      // Create company settings
      const { error: settingsError } = await supabase
        .from('company_settings')
        .insert({
          company_id: companyData.id,
          user_id: user.id,
          company_name: name,
          country: settings.country || 'ZA',
          company_type: settings.company_type || 'trading',
          email: settings.email || '',
          phone: settings.phone || '',
          address: settings.address || '',
          city: settings.city || '',
          state: settings.state || '',
          postal_code: settings.postal_code || '',
          tax_number: settings.tax_number || '',
          registration_number: settings.registration_number || '',
          currency: settings.currency || 'ZAR',
          currency_symbol: settings.currency_symbol || 'R',
          logo_url: settings.logo_url,
          tax_rate: settings.tax_rate || 15,
          financial_year_end: settings.financial_year_end || '02-28',
          invoice_prefix: settings.invoice_prefix || 'INV',
          invoice_start_number: settings.invoice_start_number || 1,
          quote_prefix: settings.quote_prefix || 'QTE',
          quote_start_number: settings.quote_start_number || 1,
          purchase_prefix: settings.purchase_prefix || 'PO',
          purchase_start_number: settings.purchase_start_number || 1,
        });

      if (settingsError) throw settingsError;

      // Refresh companies
      await loadCompanies();

      toast({
        title: 'Success',
        description: 'Company created successfully',
      });

      return companyData;
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: 'Error',
        description: 'Failed to create company',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCompany = async (companyId: string, name: string, settings?: Partial<CompanySettings>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ name })
        .eq('id', companyId);

      if (error) throw error;

      // Update company settings if provided
      if (settings) {
        await updateCompanySettings(companyId, settings);
      }

      // Refresh companies
      await loadCompanies();

      toast({
        title: 'Success',
        description: 'Company updated successfully',
      });

      return true;
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: 'Error',
        description: 'Failed to update company',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateCompanySettings = async (companyId: string, settings: Partial<CompanySettings>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if settings exist
      const { data: existing } = await supabase
        .from('company_settings')
        .select('id')
        .eq('company_id', companyId)
        .single();

      if (existing) {
        // Update existing settings
        const { error } = await supabase
          .from('company_settings')
          .update(settings)
          .eq('company_id', companyId);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('company_settings')
          .insert({
            ...settings,
            company_id: companyId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // Reload settings if this is the active company
      if (activeCompany?.id === companyId) {
        await loadCompanySettings(companyId);
      }

      return true;
    } catch (error) {
      console.error('Error updating company settings:', error);
      return false;
    }
  };

  const deleteCompany = async (companyId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      // Refresh companies
      await loadCompanies();

      toast({
        title: 'Success',
        description: 'Company deleted successfully',
      });

      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      });
      return false;
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        activeCompanySettings,
        setActiveCompany,
        createCompany,
        updateCompany,
        deleteCompany,
        updateCompanySettings,
        loading,
        refreshCompanies: loadCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
