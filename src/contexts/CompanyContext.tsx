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
  setActiveCompany: (company: Company | null) => void;
  createCompany: (name: string) => Promise<Company | null>;
  loading: boolean;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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

  const setActiveCompany = (company: Company | null) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem('activeCompanyId', company.id);
    } else {
      localStorage.removeItem('activeCompanyId');
    }
  };

  const createCompany = async (name: string): Promise<Company | null> => {
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

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompany,
        createCompany,
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
