import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, Eye, Pencil, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { useCompany } from '@/contexts/CompanyContext';
import { countries } from '@/types/settings';
import { loadSettings, saveSettings as saveLocalSettings } from '@/utils/settingsStorage';
import { loadChartOfAccounts, saveChartOfAccounts, addChartAccount, updateChartAccount, deleteChartAccount, generateNextAccountNumber } from '@/utils/chartOfAccountsStorage';
import { generateChartOfAccountsPDF, generateChartOfAccountsExcel } from '@/utils/chartOfAccountsReports';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Save, Upload, X, FileDown, FileSpreadsheet, Database, Shield, MoreVertical, Download } from 'lucide-react';
import { CreateCompanyDialog } from '@/components/CreateCompanyDialog';
import { defaultChartOfAccounts } from '@/types/chartOfAccounts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AccountType } from '@/types/accounting';

export default function LandingSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings: contextSettings, loading, saveSettings: saveToContext } = useSettings();
  const { companies, activeCompany, activeCompanySettings, createCompany, updateCompany, deleteCompany, updateCompanySettings } = useCompany();
  const [localSettings, setLocalSettings] = useState(contextSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Payroll Settings State
  const [payrollSettings, setPayrollSettings] = useState<any>(null);
  const [taxBrackets, setTaxBrackets] = useState<any[]>([]);
  const [newBracket, setNewBracket] = useState({
    age_group: 'under_65',
    bracket_min: 0,
    bracket_max: null as number | null,
    rate: 0,
    threshold: 0,
    rebate: 0,
  });
  const [editedBrackets, setEditedBrackets] = useState<any[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  // Local state for age-based thresholds/rebates to allow editing even if the rows don't exist yet
  const [ageThresholds, setAgeThresholds] = useState<Record<string, { threshold: number; rebate: number; id?: string }>>({
    under_65: { threshold: 0, rebate: 0 },
    '65_to_75': { threshold: 0, rebate: 0 },
    over_75: { threshold: 0, rebate: 0 },
  });
  
  // Audit Trail State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [filteredAuditLogs, setFilteredAuditLogs] = useState<any[]>([]);
  const [auditFilters, setAuditFilters] = useState({
    startDate: '',
    endDate: '',
    entityType: 'all',
    action: 'all',
  });
  useEffect(() => {
    setEditedBrackets(taxBrackets.map((b) => ({ ...b })));
    // Build a quick lookup map for age thresholds/rebates from fetched brackets
    const map: Record<string, { threshold: number; rebate: number; id?: string }> = {
      under_65: { threshold: 0, rebate: 0 },
      '65_to_75': { threshold: 0, rebate: 0 },
      over_75: { threshold: 0, rebate: 0 },
    };
    taxBrackets.forEach((b) => {
      if (b.bracket_min === 0 && (b.age_group === 'under_65' || b.age_group === '65_to_75' || b.age_group === 'over_75')) {
        map[b.age_group] = { threshold: b.threshold ?? 0, rebate: b.rebate ?? 0, id: b.id };
      }
    });
    setAgeThresholds(map);
  }, [taxBrackets]);
  // Load company settings when active company changes
  useEffect(() => {
    if (activeCompanySettings) {
      setTaxRate(activeCompanySettings.tax_rate || 0.15);
      const yearEnd = activeCompanySettings.financial_year_end?.split('-')[0] || '02';
      setFinancialYearEnd(parseInt(yearEnd));
      setInvoicePrefix(activeCompanySettings.invoice_prefix || 'INV');
      setInvoiceStartNumber(activeCompanySettings.invoice_start_number || 1);
      setQuotePrefix(activeCompanySettings.quote_prefix || 'QTE');
      setQuoteStartNumber(activeCompanySettings.quote_start_number || 1);
      setPurchasePrefix(activeCompanySettings.purchase_prefix || 'PO');
      setPurchaseStartNumber(activeCompanySettings.purchase_start_number || 1);
    }
  }, [activeCompanySettings]);

  useEffect(() => {
    if (activeCompany) {
      loadPayrollSettings();
      loadAuditLogs();
    }
  }, [activeCompany]);
  
  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      if (!activeCompany || !isOwner) return;
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAuditLogs(data || []);
      setFilteredAuditLogs(data || []);
    } catch (error: any) {
      console.error('Error loading audit logs:', error);
    }
  };
  
  // Filter audit logs
  useEffect(() => {
    let filtered = [...auditLogs];
    
    if (auditFilters.startDate) {
      filtered = filtered.filter(log => 
        new Date(log.created_at) >= new Date(auditFilters.startDate)
      );
    }
    
    if (auditFilters.endDate) {
      filtered = filtered.filter(log => 
        new Date(log.created_at) <= new Date(auditFilters.endDate)
      );
    }
    
    if (auditFilters.entityType && auditFilters.entityType !== 'all') {
      filtered = filtered.filter(log => 
        log.entity_type === auditFilters.entityType
      );
    }
    
    if (auditFilters.action && auditFilters.action !== 'all') {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(auditFilters.action.toLowerCase())
      );
    }
    
    setFilteredAuditLogs(filtered);
  }, [auditFilters, auditLogs]);

  const loadPayrollSettings = async () => {
    try {
      if (!activeCompany) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('company_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', activeCompany.id)
        .maybeSingle();

      const isOwner = member?.role === 'owner';
      setIsOwner(isOwner);

      let { data: settingsData } = await supabase
        .from('payroll_settings')
        .select('*')
        .eq('company_id', activeCompany.id)
        .maybeSingle();

      if (!settingsData && isOwner) {
        const countryCode = activeCompanySettings?.country || 'ZA';
        const countryMeta = countries.find(c => c.code === countryCode);
        const { data: newSettings, error: insertError } = await supabase
          .from('payroll_settings')
          .insert([{
            company_id: activeCompany.id,
            country: countryCode,
            currency: countryMeta?.currency || 'ZAR',
            currency_symbol: countryMeta?.symbol || 'R',
            current_tax_year: new Date().getFullYear(),
          }])
          .select()
          .single();
        if (insertError) throw insertError;
        settingsData = newSettings;
      } else if (!settingsData) {
        const countryCode = activeCompanySettings?.country || 'ZA';
        setPayrollSettings({
          id: 'readonly',
          company_id: activeCompany.id,
          country: countryCode,
          currency: activeCompanySettings?.currency || (countries.find(c => c.code === countryCode)?.currency || 'ZAR'),
          currency_symbol: activeCompanySettings?.currency_symbol || (countries.find(c => c.code === countryCode)?.symbol || 'R'),
          current_tax_year: new Date().getFullYear(),
        } as any);
        return;
      }

      setPayrollSettings(settingsData);
      loadTaxBrackets(settingsData.country, settingsData.current_tax_year);
    } catch (e) {
      setPayrollSettings({
        id: 'readonly',
        company_id: activeCompany?.id,
        country: activeCompanySettings?.country || 'ZA',
        currency: activeCompanySettings?.currency || 'ZAR',
        currency_symbol: activeCompanySettings?.currency_symbol || 'R',
        current_tax_year: new Date().getFullYear(),
      } as any);
    }
  };

  const loadTaxBrackets = async (country: string, year: number) => {
    const { data } = await supabase
      .from('tax_brackets')
      .select('*')
      .eq('country', country)
      .eq('year', year)
      .order('bracket_min');

    if (data) {
      setTaxBrackets(data);
    }
  };
  
  // Company form state
  const [showCreateCompanyDialog, setShowCreateCompanyDialog] = useState(false);
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    country: 'ZA',
    companyType: 'trading',
    email: '',
    phone: '',
    address: '',
    vatNumber: '',
    incomeTaxNumber: '',
    companyRegistrationNumber: '',
    logoUrl: '',
    primaryColor: '#3b82f6',
  });
  
  // Accounting-specific state
  const [taxRate, setTaxRate] = useState(contextSettings.taxRate || 0.15);
  const [financialYearEnd, setFinancialYearEnd] = useState(12);
  const [invoicePrefix, setInvoicePrefix] = useState(contextSettings.invoicePrefix || 'INV-');
  const [invoiceStartNumber, setInvoiceStartNumber] = useState(contextSettings.invoiceStartNumber || 1);
  const [quotePrefix, setQuotePrefix] = useState(contextSettings.quotePrefix || 'QT-');
  const [quoteStartNumber, setQuoteStartNumber] = useState(contextSettings.quoteStartNumber || 1);
  const [purchasePrefix, setPurchasePrefix] = useState(contextSettings.purchasePrefix || 'PO-');
  const [purchaseStartNumber, setPurchaseStartNumber] = useState(contextSettings.purchaseStartNumber || 1);
  const [accounts, setAccounts] = useState(() => loadChartOfAccounts());
  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>({});
  const [showOpeningBalances, setShowOpeningBalances] = useState(false);
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [showEditAccountDialog, setShowEditAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [newAccount, setNewAccount] = useState({ accountNumber: '', accountName: '', accountType: 'current-asset' as AccountType });

  const selectedCountry = countries.find(c => c.code === localSettings.country);
  const formSelectedCountry = countries.find(c => c.code === companyFormData.country);

  const handleChange = (field: keyof typeof localSettings, value: string | number) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyFormChange = (field: keyof typeof companyFormData, value: string) => {
    setCompanyFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCompany = () => {
    setShowCreateCompanyDialog(true);
  };

  const handleEditCompany = async (company: any) => {
    setEditingCompany(company);
    
    // Fetch the company settings to populate the form
    const { data: settings } = await supabase
      .from('company_settings')
      .select('*')
      .eq('company_id', company.id)
      .maybeSingle();
    
    setCompanyFormData({
      companyName: company.name || '',
      country: settings?.country || 'ZA',
      companyType: settings?.company_type || 'trading',
      email: settings?.email || '',
      phone: settings?.phone || '',
      address: settings?.address || '',
      vatNumber: settings?.tax_number || '',
      incomeTaxNumber: settings?.tax_number || '',
      companyRegistrationNumber: settings?.registration_number || '',
      logoUrl: settings?.logo_url || '',
      primaryColor: '#3b82f6',
    });
    setShowCompanyForm(true);
  };

  const handleDeleteCompany = async (companyId: string) => {
    const confirmDelete = confirm('Are you sure you want to delete this company? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      const success = await deleteCompany(companyId);
      
      if (success) {
        toast({
          title: 'Success',
          description: 'Company deleted successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      });
    }
  };

  const handleTaxYearChange = async (year: string) => {
    if (!payrollSettings || !activeCompany || !activeCompanySettings) return;

    const { error } = await supabase
      .from('payroll_settings')
      .update({ current_tax_year: parseInt(year) })
      .eq('id', payrollSettings.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tax year',
        variant: 'destructive',
      });
      return;
    }

    setPayrollSettings({ ...payrollSettings, current_tax_year: parseInt(year) });
    loadTaxBrackets(activeCompanySettings.country || 'ZA', parseInt(year));

    toast({
      title: 'Success',
      description: 'Tax year updated',
    });
  };

  const handleAddBracket = async () => {
    if (!payrollSettings || !activeCompany || !activeCompanySettings) return;
    if (!isOwner) {
      toast({ title: 'Permission denied', description: 'Only owners can manage tax brackets.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('tax_brackets')
      .insert([{
        ...newBracket,
        rate: newBracket.rate / 100, // Convert percentage to decimal
        year: payrollSettings.current_tax_year,
        country: activeCompanySettings.country || 'ZA',
      }]);

    if (error) {
      const message = error.message?.toLowerCase().includes('row-level security')
        ? 'Only owners can manage tax brackets.'
        : 'Failed to add tax bracket';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return;
    }

    loadTaxBrackets(activeCompanySettings.country || 'ZA', payrollSettings.current_tax_year);
    setNewBracket({
      age_group: 'under_65',
      bracket_min: 0,
      bracket_max: null,
      rate: 0,
      threshold: 0,
      rebate: 0,
    });

    toast({
      title: 'Success',
      description: 'Tax bracket added',
    });
  };

  const handleDeleteBracket = async (id: string) => {
    if (!isOwner) {
      toast({ title: 'Permission denied', description: 'Only owners can manage tax brackets.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase
      .from('tax_brackets')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete tax bracket',
        variant: 'destructive',
      });
      return;
    }

    if (payrollSettings && activeCompany && activeCompanySettings) {
      loadTaxBrackets(activeCompanySettings.country || 'ZA', payrollSettings.current_tax_year);
    }

    toast({
      title: 'Success',
      description: 'Tax bracket deleted',
    });
  };

  // Editing helpers for SA tax table
  const handleBracketFieldChange = (
    id: string,
    field: 'bracket_min' | 'bracket_max' | 'rate' | 'threshold' | 'rebate',
    value: number | null
  ) => {
    setEditedBrackets((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const handleSaveBrackets = async () => {
    if (!isOwner) {
      toast({ title: 'Permission denied', description: 'Only owners can manage tax brackets.', variant: 'destructive' });
      return;
    }
    try {
      await Promise.all(
        editedBrackets.map((b) =>
          supabase
            .from('tax_brackets')
            .update({
              bracket_min: b.bracket_min,
              bracket_max: b.bracket_max,
              rate: b.rate / 100, // Convert percentage to decimal
              threshold: b.threshold,
              rebate: b.rebate,
            })
            .eq('id', b.id)
        )
      );
      setTaxBrackets(editedBrackets);
      toast({ title: 'Saved', description: 'Tax brackets updated successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save tax brackets', variant: 'destructive' });
    }
  };

  const handleSaveAgeThresholds = async () => {
    if (!isOwner) {
      toast({ title: 'Permission denied', description: 'Only owners can manage tax brackets.', variant: 'destructive' });
      return;
    }
    if (!payrollSettings || !activeCompanySettings) return;
    const year = payrollSettings.current_tax_year;
    const country = activeCompanySettings.country || 'ZA';
    const groups: Array<'under_65' | '65_to_75' | 'over_75'> = ['under_65', '65_to_75', 'over_75'];
    try {
      await Promise.all(
        groups.map(async (g) => {
          const vals = ageThresholds[g] || { threshold: 0, rebate: 0 };
          const existing = taxBrackets.find((b) => b.age_group === g && b.bracket_min === 0);
          if (existing) {
            await supabase
              .from('tax_brackets')
              .update({ threshold: vals.threshold, rebate: vals.rebate })
              .eq('id', existing.id);
          } else {
            await supabase
              .from('tax_brackets')
              .insert([
                {
                  age_group: g,
                  bracket_min: 0,
                  bracket_max: null,
                  rate: 0,
                  threshold: vals.threshold,
                  rebate: vals.rebate,
                  year,
                  country,
                },
              ]);
          }
        })
      );
      await loadTaxBrackets(country, year);
      toast({ title: 'Saved', description: 'Thresholds & rebates saved.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save thresholds & rebates', variant: 'destructive' });
    }
  };

  const handleSMTPUpdate = async (field: string, value: string | number) => {
    try {
      if (!payrollSettings) return;

      const { error } = await supabase
        .from('payroll_settings')
        .update({ [field]: value })
        .eq('id', payrollSettings.id);

      if (error) throw error;

      setPayrollSettings({
        ...payrollSettings,
        [field]: value
      });

      toast({
        title: 'Success',
        description: 'SMTP settings updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSaveCompanyForm = async () => {
    if (!companyFormData.companyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive",
      });
      return;
    }

    // Get country details to set currency
    const selectedCountry = countries.find(c => c.code === companyFormData.country);

    const settings: any = {
      company_name: companyFormData.companyName,
      country: companyFormData.country,
      company_type: companyFormData.companyType,
      email: companyFormData.email || '',
      phone: companyFormData.phone || '',
      address: companyFormData.address || '',
      city: '',
      state: '',
      postal_code: '',
      tax_number: companyFormData.vatNumber || '',
      registration_number: companyFormData.companyRegistrationNumber || '',
      currency: selectedCountry?.currency || 'ZAR',
      currency_symbol: selectedCountry?.symbol || 'R',
      logo_url: companyFormData.logoUrl || undefined,
      tax_rate: 15,
      financial_year_end: '02-28',
      invoice_prefix: 'INV',
      invoice_start_number: 1,
      quote_prefix: 'QTE',
      quote_start_number: 1,
      purchase_prefix: 'PO',
      purchase_start_number: 1,
    };

    if (editingCompany) {
      // Update existing company
      const success = await updateCompany(editingCompany.id, companyFormData.companyName, settings);
      if (success) {
        setShowCompanyForm(false);
      }
    } else {
      // Create new company
      const newCompany = await createCompany(companyFormData.companyName, settings);
      if (newCompany) {
        setShowCompanyForm(false);
      }
    }
  };

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCompanyLogo = () => {
    setCompanyFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLocalSettings(prev => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCompanySettings = async () => {
    try {
      await saveToContext(localSettings);
      toast({
        title: "Settings saved",
        description: "Company settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAccountingSettings = async () => {
    if (!activeCompany) {
      toast({
        title: "Error",
        description: "Please select a company first.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateCompanySettings(activeCompany.id, {
      tax_rate: taxRate,
      financial_year_end: `${financialYearEnd.toString().padStart(2, '0')}-28`,
      invoice_prefix: invoicePrefix,
      invoice_start_number: invoiceStartNumber,
      quote_prefix: quotePrefix,
      quote_start_number: quoteStartNumber,
      purchase_prefix: purchasePrefix,
      purchase_start_number: purchaseStartNumber,
    });
    
    if (success) {
      const updatedAccounts = accounts.map(acc => ({
        ...acc,
        openingBalance: openingBalances[acc.id] || acc.openingBalance || 0
      }));
      saveChartOfAccounts(updatedAccounts);
      setAccounts(updatedAccounts);
      
      toast({
        title: "Settings saved",
        description: "Accounting settings have been updated successfully.",
      });
    }
  };

  const handleDownloadPDF = () => {
    const latest = loadChartOfAccounts();
    setAccounts(latest);
    generateChartOfAccountsPDF(latest);
    toast({
      title: "PDF Downloaded",
      description: "Chart of accounts has been exported to PDF.",
    });
  };

  const handleDownloadExcel = () => {
    const latest = loadChartOfAccounts();
    setAccounts(latest);
    generateChartOfAccountsExcel(latest);
    toast({
      title: "Excel Downloaded",
      description: "Chart of accounts has been exported to Excel.",
    });
  };

  const handleOpeningBalanceChange = (accountId: string, value: string) => {
    setOpeningBalances(prev => ({
      ...prev,
      [accountId]: parseFloat(value) || 0
    }));
  };

  const handleAccountTypeChange = (accountType: AccountType) => {
    const nextNumber = generateNextAccountNumber(accountType);
    setNewAccount({ ...newAccount, accountType, accountNumber: nextNumber });
  };

  const handleCreateAccount = () => {
    if (!newAccount.accountNumber || !newAccount.accountName) {
      toast({ title: 'Please fill in account number and name', variant: 'destructive' });
      return;
    }
    
    addChartAccount({ ...newAccount, isDefault: false });
    const updatedAccounts = loadChartOfAccounts();
    setAccounts(updatedAccounts);
    setShowNewAccountDialog(false);
    setNewAccount({ accountNumber: '', accountName: '', accountType: 'current-asset' });
    toast({ title: 'Account created successfully' });
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount({ ...account });
    setShowEditAccountDialog(true);
  };

  const handleUpdateAccount = () => {
    if (!editingAccount?.accountName) {
      toast({ title: 'Please fill in account name', variant: 'destructive' });
      return;
    }
    
    updateChartAccount(editingAccount.id, {
      accountName: editingAccount.accountName,
      accountType: editingAccount.accountType,
    });
    const updatedAccounts = loadChartOfAccounts();
    setAccounts(updatedAccounts);
    setShowEditAccountDialog(false);
    setEditingAccount(null);
    toast({ title: 'Account updated successfully' });
  };

  const handleDeleteAccount = (account: any) => {
    const balance = account.openingBalance || 0;
    
    if (balance !== 0) {
      toast({ 
        title: 'Cannot delete account', 
        description: 'Only accounts with zero balance can be deleted.',
        variant: 'destructive' 
      });
      return;
    }

    if (confirm(`Are you sure you want to delete "${account.accountName}"?`)) {
      deleteChartAccount(account.id);
      const updatedAccounts = loadChartOfAccounts();
      setAccounts(updatedAccounts);
      toast({ title: 'Account deleted successfully' });
    }
  };

  const [showResetWarning, setShowResetWarning] = useState(false);

  const handleResetChartOfAccounts = () => {
    setShowResetWarning(true);
  };

  const confirmResetChartOfAccounts = () => {
    const standardChart = defaultChartOfAccounts.map(acc => ({
      ...acc,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }));
    saveChartOfAccounts(standardChart);
    setAccounts(standardChart);
    setShowResetWarning(false);
    toast({
      title: "Chart of Accounts Reset",
      description: "Standard chart of accounts has been loaded successfully.",
    });
  };

  const getCategoryLabel = (type: string) => {
    const labels: Record<string, string> = {
      'current-asset': 'Current Asset',
      'non-current-asset': 'Non-Current Asset',
      'current-liability': 'Current Liability',
      'non-current-liability': 'Non-Current Liability',
      'equity': 'Equity',
      'revenue': 'Revenue/Income',
      'expense': 'Expense',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/landing')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage company settings for both Accounting and Payroll & HR systems
            </p>
          </div>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className={`grid w-full ${isOwner ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="company">Company Settings</TabsTrigger>
            <TabsTrigger value="accounting">Accounting Settings</TabsTrigger>
            <TabsTrigger value="payroll">Payroll & HR Settings</TabsTrigger>
            {isOwner && <TabsTrigger value="audit">Audit Trail</TabsTrigger>}
          </TabsList>

          {/* Company Settings Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card className="shadow-[var(--shadow-elegant)] border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Companies</CardTitle>
                    <CardDescription>
                      Manage all your companies and their settings
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddCompany} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Company
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>{new Date(company.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteCompany(company.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Company Form Dialog */}
            <Dialog open={showCompanyForm} onOpenChange={setShowCompanyForm}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCompany ? 'Edit Company' : 'Add New Company'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCompany 
                      ? 'Update company information below' 
                      : 'Enter company details to create a new company'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyFormData.companyName}
                        onChange={(e) => handleCompanyFormChange('companyName', e.target.value)}
                        placeholder="Your Company Name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Select
                        value={companyFormData.country}
                        onValueChange={(value) => handleCompanyFormChange('country', value)}
                      >
                        <SelectTrigger id="country">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(c => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name} ({c.symbol})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyType">Company Type</Label>
                      <Select
                        value={companyFormData.companyType}
                        onValueChange={(value) => handleCompanyFormChange('companyType', value)}
                      >
                        <SelectTrigger id="companyType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trading">Trading Company</SelectItem>
                          <SelectItem value="manufacturer">Manufacturer</SelectItem>
                          <SelectItem value="contractor">Contractor</SelectItem>
                          <SelectItem value="professional-services">Professional Services</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={companyFormData.email}
                        onChange={(e) => handleCompanyFormChange('email', e.target.value)}
                        placeholder="contact@company.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={companyFormData.phone}
                        onChange={(e) => handleCompanyFormChange('phone', e.target.value)}
                        placeholder="+27 12 345 6789"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={companyFormData.address}
                        onChange={(e) => handleCompanyFormChange('address', e.target.value)}
                        placeholder="123 Business St, City, Province, Postal Code"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Tax Registration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="vatNumber">{formSelectedCountry?.vatLabel || 'VAT Number'}</Label>
                        <Input
                          id="vatNumber"
                          value={companyFormData.vatNumber}
                          onChange={(e) => handleCompanyFormChange('vatNumber', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="incomeTaxNumber">{formSelectedCountry?.incomeTaxLabel || 'Tax Number'}</Label>
                        <Input
                          id="incomeTaxNumber"
                          value={companyFormData.incomeTaxNumber}
                          onChange={(e) => handleCompanyFormChange('incomeTaxNumber', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="companyRegistrationNumber">{formSelectedCountry?.companyRegLabel || 'Registration Number'}</Label>
                        <Input
                          id="companyRegistrationNumber"
                          value={companyFormData.companyRegistrationNumber}
                          onChange={(e) => handleCompanyFormChange('companyRegistrationNumber', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Branding</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Company Logo</Label>
                        <div className="flex items-start gap-4">
                          {companyFormData.logoUrl && (
                            <div className="relative">
                              <img 
                                src={companyFormData.logoUrl} 
                                alt="Company logo" 
                                className="h-24 w-auto object-contain border rounded-lg p-2"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6"
                                onClick={removeCompanyLogo}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCompanyLogoUpload}
                              className="hidden"
                              id="company-logo-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('company-logo-upload')?.click()}
                              className="gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              {companyFormData.logoUrl ? 'Change Logo' : 'Upload Logo'}
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Brand Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={companyFormData.primaryColor}
                            onChange={(e) => handleCompanyFormChange('primaryColor', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            value={companyFormData.primaryColor}
                            onChange={(e) => handleCompanyFormChange('primaryColor', e.target.value)}
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCompanyForm(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveCompanyForm} className="gap-2">
                      <Save className="h-4 w-4" />
                      {editingCompany ? 'Update Company' : 'Create Company'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Accounting Settings Tab */}
          <TabsContent value="accounting" className="space-y-6">
            <Card className="shadow-[var(--shadow-elegant)] border-border/50">
              <CardHeader>
                <CardTitle>Tax & Accounting Preferences</CardTitle>
                <CardDescription>
                  Configure default settings for invoices, quotes, and financial documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default VAT/Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRate * 100}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100)}
                      placeholder="15.0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="financialYearEnd">Financial Year End</Label>
                    <Select
                      value={financialYearEnd.toString()}
                      onValueChange={(value) => setFinancialYearEnd(parseInt(value))}
                    >
                      <SelectTrigger id="financialYearEnd">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-elegant)] border-border/50">
              <CardHeader>
                <CardTitle>Chart of Accounts</CardTitle>
                <CardDescription>
                  View, download, and manage your chart of accounts and opening balances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Account</DialogTitle>
                        <DialogDescription>
                          Add a new account to your chart of accounts
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Account Type</Label>
                          <Select
                            value={newAccount.accountType}
                            onValueChange={(value: AccountType) => handleAccountTypeChange(value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="current-asset">Current Asset (1xxx)</SelectItem>
                              <SelectItem value="non-current-asset">Non-Current Asset (2xxx)</SelectItem>
                              <SelectItem value="current-liability">Current Liability (3xxx)</SelectItem>
                              <SelectItem value="non-current-liability">Non-Current Liability (4xxx)</SelectItem>
                              <SelectItem value="equity">Equity (5xxx)</SelectItem>
                              <SelectItem value="revenue">Revenue (6xxx)</SelectItem>
                              <SelectItem value="expense">Expense (7xxx-9xxx)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Account Number</Label>
                          <Input
                            value={newAccount.accountNumber}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Account Name</Label>
                          <Input
                            value={newAccount.accountName}
                            onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                            placeholder="e.g., Marketing Expense"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => {
                          setShowNewAccountDialog(false);
                          setNewAccount({ accountNumber: '', accountName: '', accountType: 'current-asset' });
                        }}>Cancel</Button>
                        <Button onClick={handleCreateAccount}>Create</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button onClick={handleDownloadExcel} variant="outline" className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Download Excel
                  </Button>
                  <Dialog open={showOpeningBalances} onOpenChange={setShowOpeningBalances}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Database className="h-4 w-4" />
                        Set Opening Balances
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Set Opening Balances</DialogTitle>
                        <DialogDescription>
                          Enter opening balances for each account. Leave blank or zero if no opening balance.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {accounts.map((account) => (
                          <div key={account.id} className="grid grid-cols-2 gap-4 items-center">
                            <Label htmlFor={`balance-${account.id}`} className="text-sm">
                              {account.accountNumber} - {account.accountName}
                            </Label>
                            <Input
                              id={`balance-${account.id}`}
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              defaultValue={account.openingBalance || 0}
                              onChange={(e) => handleOpeningBalanceChange(account.id, e.target.value)}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowOpeningBalances(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => {
                          handleSaveAccountingSettings();
                          setShowOpeningBalances(false);
                        }}>
                          Save Balances
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button onClick={handleResetChartOfAccounts} variant="outline" className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Load Standard Chart
                  </Button>
                  
                  <AlertDialog open={showResetWarning} onOpenChange={setShowResetWarning}>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Load Standard Chart of Accounts?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p className="font-semibold text-foreground">⚠️ Warning: This action will have the following implications:</p>
                          <ul className="list-disc pl-6 space-y-2 text-sm">
                            <li><strong>All custom accounts will be removed</strong> - Any accounts you've created or modified will be permanently deleted</li>
                            <li><strong>Opening balances will be reset</strong> - All current account balances will be lost</li>
                            <li><strong>Journal entries may become invalid</strong> - Existing transactions referencing custom accounts may break</li>
                            <li><strong>Reports will be affected</strong> - Financial reports based on your current chart will need to be regenerated</li>
                            <li><strong>This action cannot be undone</strong> - There is no way to recover your current chart after loading the standard one</li>
                          </ul>
                          <p className="text-foreground font-medium mt-4">Only proceed if you want to completely reset your chart of accounts to the standard template.</p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmResetChartOfAccounts} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Yes, Load Standard Chart
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Display Chart of Accounts Table */}
                <div className="mt-6 border rounded-lg">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Account Code</TableHead>
                          <TableHead>Account Name</TableHead>
                          <TableHead className="w-[200px]">Category</TableHead>
                          <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                              No accounts found. Click "Load Standard Chart" to initialize.
                            </TableCell>
                          </TableRow>
                        ) : (
                          accounts.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell className="font-mono">{account.accountNumber}</TableCell>
                              <TableCell>{account.accountName}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {getCategoryLabel(account.accountType)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditAccount(account)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteAccount(account)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                {/* Edit Account Dialog */}
                <Dialog open={showEditAccountDialog} onOpenChange={setShowEditAccountDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Account</DialogTitle>
                      <DialogDescription>
                        Update account details
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          value={editingAccount?.accountNumber || ''}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Type</Label>
                        <Select
                          value={editingAccount?.accountType || 'current-asset'}
                          onValueChange={(value: AccountType) => 
                            setEditingAccount({ ...editingAccount, accountType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current-asset">Current Asset (1xxx)</SelectItem>
                            <SelectItem value="non-current-asset">Non-Current Asset (2xxx)</SelectItem>
                            <SelectItem value="current-liability">Current Liability (3xxx)</SelectItem>
                            <SelectItem value="non-current-liability">Non-Current Liability (4xxx)</SelectItem>
                            <SelectItem value="equity">Equity (5xxx)</SelectItem>
                            <SelectItem value="revenue">Revenue (6xxx)</SelectItem>
                            <SelectItem value="expense">Expense (7xxx-9xxx)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input
                          value={editingAccount?.accountName || ''}
                          onChange={(e) => 
                            setEditingAccount({ ...editingAccount, accountName: e.target.value })
                          }
                          placeholder="e.g., Marketing Expense"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setShowEditAccountDialog(false);
                        setEditingAccount(null);
                      }}>Cancel</Button>
                      <Button onClick={handleUpdateAccount}>Update</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-elegant)] border-border/50">
              <CardHeader>
                <CardTitle>Document Sequence Numbers</CardTitle>
                <CardDescription>
                  Configure starting numbers and prefixes for documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Invoices</h3>
                    <div className="space-y-2">
                      <Label htmlFor="invoicePrefix">Prefix</Label>
                      <Input
                        id="invoicePrefix"
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value)}
                        placeholder="INV-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invoiceStart">Starting Number</Label>
                      <Input
                        id="invoiceStart"
                        type="number"
                        min="1"
                        value={invoiceStartNumber}
                        onChange={(e) => setInvoiceStartNumber(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Quotes</h3>
                    <div className="space-y-2">
                      <Label htmlFor="quotePrefix">Prefix</Label>
                      <Input
                        id="quotePrefix"
                        value={quotePrefix}
                        onChange={(e) => setQuotePrefix(e.target.value)}
                        placeholder="QT-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quoteStart">Starting Number</Label>
                      <Input
                        id="quoteStart"
                        type="number"
                        min="1"
                        value={quoteStartNumber}
                        onChange={(e) => setQuoteStartNumber(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Purchase Orders</h3>
                    <div className="space-y-2">
                      <Label htmlFor="purchasePrefix">Prefix</Label>
                      <Input
                        id="purchasePrefix"
                        value={purchasePrefix}
                        onChange={(e) => setPurchasePrefix(e.target.value)}
                        placeholder="PO-"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="purchaseStart">Starting Number</Label>
                      <Input
                        id="purchaseStart"
                        type="number"
                        min="1"
                        value={purchaseStartNumber}
                        onChange={(e) => setPurchaseStartNumber(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-elegant)] border-border/50">
              <CardHeader>
                <CardTitle>Tax Compliance Integration</CardTitle>
                <CardDescription>
                  Configure tax authority requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate('/tax-compliance')} className="gap-2">
                  <Shield className="h-4 w-4" />
                  Configure Tax Compliance
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveAccountingSettings} className="gap-2">
                <Save className="h-4 w-4" />
                Save Accounting Settings
              </Button>
            </div>
          </TabsContent>

          {/* Payroll & HR Settings Tab */}
          <TabsContent value="payroll" className="space-y-6">
            {!activeCompany ? (
              <Card className="shadow-[var(--shadow-elegant)] border-border/50">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Please select a company first to configure payroll settings.</p>
                </CardContent>
              </Card>
            ) : !payrollSettings ? (
              <Card className="shadow-[var(--shadow-elegant)] border-border/50">
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Loading payroll settings...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Country & Currency Display */}
                <Card className="shadow-[var(--shadow-elegant)] border-border/50">
                  <CardHeader>
                    <CardTitle>Country & Currency</CardTitle>
                    <CardDescription>
                      These settings are automatically configured based on the selected company's country
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label>Country</Label>
                        <Input 
                          value={activeCompanySettings?.country === 'ZA' ? 'South Africa' : activeCompanySettings?.country === 'ZW' ? 'Zimbabwe' : 'Zambia'} 
                          disabled 
                        />
                      </div>

                      <div>
                        <Label>Currency</Label>
                        <Input value={payrollSettings.currency} disabled />
                      </div>

                      <div>
                        <Label>Symbol</Label>
                        <Input value={payrollSettings.currency_symbol} disabled />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Year */}
                <Card className="shadow-[var(--shadow-elegant)] border-border/50">
                  <CardHeader>
                    <CardTitle>Tax Year Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-xs">
                      <Label>Current Tax Year</Label>
                      <Select 
                        value={payrollSettings.current_tax_year.toString()} 
                        onValueChange={handleTaxYearChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}/{year + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Brackets */}
                <Card className="shadow-[var(--shadow-elegant)] border-border/50">
                  <CardHeader>
                    <CardTitle>
                      Tax Brackets - {activeCompanySettings?.country === 'ZA' ? 'South Africa' : activeCompanySettings?.country === 'ZW' ? 'Zimbabwe' : 'Zambia'} ({payrollSettings.current_tax_year}/{payrollSettings.current_tax_year + 1})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Add New Bracket */}
                    <div className="p-4 bg-secondary/20 rounded-lg">
                      <h3 className="font-medium mb-3">Add New Tax Bracket</h3>
                      {activeCompanySettings?.country === 'ZA' ? (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div>
                            <Label className="text-xs">Min Income (R)</Label>
                            <Input
                              type="number"
                              value={newBracket.bracket_min}
                              onChange={(e) => setNewBracket({ ...newBracket, bracket_min: Number(e.target.value) })}
                              className="h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Max Income (R)</Label>
                            <Input
                              type="number"
                              value={newBracket.bracket_max || ''}
                              onChange={(e) => setNewBracket({ ...newBracket, bracket_max: e.target.value ? Number(e.target.value) : null })}
                              placeholder="No limit"
                              className="h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newBracket.rate}
                              onChange={(e) => setNewBracket({ ...newBracket, rate: Number(e.target.value) })}
                              className="h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Base Amount (R)</Label>
                            <Input
                              type="number"
                              value={newBracket.threshold}
                              onChange={(e) => setNewBracket({ ...newBracket, threshold: Number(e.target.value) })}
                              className="h-9"
                            />
                          </div>

                          <div className="flex items-end">
                            <Button onClick={handleAddBracket} size="sm" className="h-9 w-full">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                          <div>
                            <Label className="text-xs">Age Group</Label>
                            <Select 
                              value={newBracket.age_group} 
                              onValueChange={(value) => setNewBracket({ ...newBracket, age_group: value })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="under_65">Under 65</SelectItem>
                                <SelectItem value="65_to_75">65 to 75</SelectItem>
                                <SelectItem value="over_75">Over 75</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Min</Label>
                            <Input
                              type="number"
                              value={newBracket.bracket_min}
                              onChange={(e) => setNewBracket({ ...newBracket, bracket_min: Number(e.target.value) })}
                              className="h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Max</Label>
                            <Input
                              type="number"
                              value={newBracket.bracket_max || ''}
                              onChange={(e) => setNewBracket({ ...newBracket, bracket_max: e.target.value ? Number(e.target.value) : null })}
                              placeholder="No limit"
                              className="h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Rate %</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newBracket.rate}
                              onChange={(e) => setNewBracket({ ...newBracket, rate: Number(e.target.value) })}
                              className="h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Threshold</Label>
                            <Input
                              type="number"
                              value={newBracket.threshold}
                              onChange={(e) => setNewBracket({ ...newBracket, threshold: Number(e.target.value) })}
                              className="h-9"
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Rebate</Label>
                            <Input
                              type="number"
                              value={newBracket.rebate}
                              onChange={(e) => setNewBracket({ ...newBracket, rebate: Number(e.target.value) })}
                              className="h-9"
                            />
                          </div>

                          <div className="flex items-end">
                            <Button onClick={handleAddBracket} size="sm" className="h-9 w-full" disabled={!isOwner} title={!isOwner ? 'Only owners can manage tax brackets' : undefined}>
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Existing Brackets */}
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {activeCompanySettings?.country === 'ZA' ? (
                              <>
                                <TableHead>Min Income (R)</TableHead>
                                <TableHead>Max Income (R)</TableHead>
                                <TableHead>Rate (%)</TableHead>
                                <TableHead>Base Amount (R)</TableHead>
                                <TableHead className="w-20">Actions</TableHead>
                              </>
                            ) : (
                              <>
                                <TableHead>Tax Bands</TableHead>
                                <TableHead>Chargeable Income</TableHead>
                                <TableHead>Tax Rate</TableHead>
                                <TableHead className="w-20">Actions</TableHead>
                              </>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {taxBrackets.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={activeCompanySettings?.country === 'ZA' ? 5 : 4} className="text-center text-muted-foreground">
                                No tax brackets configured for this year. Add one above.
                              </TableCell>
                            </TableRow>
                          ) : (
                            taxBrackets.sort((a, b) => a.bracket_min - b.bracket_min).map((bracket, index) => (
                              <TableRow key={bracket.id}>
                                {activeCompanySettings?.country === 'ZA' ? (
                                  <>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={bracket.bracket_min ?? 0}
                                        onChange={(e) => handleBracketFieldChange(bracket.id, 'bracket_min', Number(e.target.value))}
                                        className="h-9"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        placeholder="No limit"
                                        value={bracket.bracket_max ?? ''}
                                        onChange={(e) => handleBracketFieldChange(bracket.id, 'bracket_max', e.target.value ? Number(e.target.value) : null)}
                                        className="h-9"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={(bracket.rate ?? 0) * 100}
                                        onChange={(e) => handleBracketFieldChange(bracket.id, 'rate', Number(e.target.value))}
                                        className="h-9"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={bracket.threshold ?? 0}
                                        onChange={(e) => handleBracketFieldChange(bracket.id, 'threshold', Number(e.target.value))}
                                        className="h-9"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteBracket(bracket.id)}
                                        disabled={!isOwner}
                                        title={!isOwner ? 'Only owners can manage tax brackets' : undefined}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </>
                                ) : (
                                  <>
                                    <TableCell>
                                      {index === 0 ? (
                                        `First ${payrollSettings.currency_symbol}${bracket.bracket_max ? bracket.bracket_max.toLocaleString() : bracket.bracket_min.toLocaleString()} @`
                                      ) : bracket.bracket_max ? (
                                        `Next ${payrollSettings.currency_symbol}${bracket.bracket_min.toLocaleString()} but not exceeding ${payrollSettings.currency_symbol}${bracket.bracket_max.toLocaleString()}`
                                      ) : (
                                        `${payrollSettings.currency_symbol}${bracket.bracket_min.toLocaleString()} and Above`
                                      )}
                                    </TableCell>
                                    <TableCell>0</TableCell>
                                    <TableCell>{bracket.rate}%</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteBracket(bracket.id)}
                                        disabled={!isOwner}
                                        title={!isOwner ? 'Only owners can manage tax brackets' : undefined}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                        </Table>
                        {activeCompanySettings?.country === 'ZA' && (
                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={handleAddBracket} className="gap-2" disabled={!isOwner} title={!isOwner ? 'Only owners can manage tax brackets' : undefined}>
                              <Plus className="h-4 w-4" />
                              Add Bracket
                            </Button>
                            <Button onClick={handleSaveBrackets} disabled={!isOwner} title={!isOwner ? 'Only owners can manage tax brackets' : undefined}>Save Tax Brackets</Button>
                            {!isOwner && (
                              <p className="text-xs text-muted-foreground">Only owners can manage tax tables.</p>
                            )}
                          </div>
                        )}
                      </div>
                  </CardContent>
                </Card>

                {activeCompanySettings?.country === 'ZA' && (
                  <Card className="shadow-[var(--shadow-elegant)] border-border/50">
                    <CardHeader>
                      <CardTitle>Age-Based Tax Thresholds & Rebates</CardTitle>
                      <CardDescription>
                        Configure age-based tax thresholds and rebates per requirements
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       {[
                         { id: 'under_65', label: 'Under 65' },
                         { id: '65_to_75', label: '65 to 75' },
                         { id: 'over_75', label: 'Over 75' },
                       ].map((g) => {
                         const vals = ageThresholds[g.id] || { threshold: 0, rebate: 0 };
                         return (
                           <div key={g.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center p-3 border rounded-lg">
                             <div>
                               <Label className="text-xs">Age Group</Label>
                               <Input value={g.label} disabled />
                             </div>
                             <div>
                               <Label className="text-xs">Tax Threshold (R)</Label>
                               <Input
                                 type="number"
                                 value={vals.threshold}
                                 onChange={(e) => setAgeThresholds(prev => ({ ...prev, [g.id]: { ...prev[g.id], threshold: Number(e.target.value) }}))}
                               />
                             </div>
                             <div>
                               <Label className="text-xs">Tax Rebate (R)</Label>
                               <Input
                                 type="number"
                                 value={vals.rebate}
                                 onChange={(e) => setAgeThresholds(prev => ({ ...prev, [g.id]: { ...prev[g.id], rebate: Number(e.target.value) }}))}
                                 disabled={!isOwner}
                               />
                             </div>
                           </div>
                         );
                       })}
                       <div className="flex justify-end">
                         <Button onClick={handleSaveAgeThresholds} disabled={!isOwner} title={!isOwner ? 'Only owners can manage tax brackets' : undefined}>Save Thresholds & Rebates</Button>
                         {!isOwner && (
                           <p className="text-xs text-muted-foreground">Only owners can manage tax tables.</p>
                         )}
                       </div>
                     </CardContent>
                    </Card>
                  )}

                {/* SMTP Email Configuration */}
                <Card className="shadow-[var(--shadow-elegant)] border-border/50">
                  <CardHeader>
                    <CardTitle>Email Configuration (SMTP)</CardTitle>
                    <CardDescription>
                      Configure SMTP settings for sending payslips via email to employees
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="smtp_host">SMTP Host</Label>
                      <Input
                        id="smtp_host"
                        type="text"
                        value={payrollSettings?.smtp_host || ''}
                        onChange={(e) => handleSMTPUpdate('smtp_host', e.target.value)}
                        placeholder="smtp.gmail.com"
                        disabled={!isOwner}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp_port">SMTP Port</Label>
                      <Input
                        id="smtp_port"
                        type="number"
                        value={payrollSettings?.smtp_port || 587}
                        onChange={(e) => handleSMTPUpdate('smtp_port', parseInt(e.target.value))}
                        placeholder="587"
                        disabled={!isOwner}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp_user">SMTP Username</Label>
                      <Input
                        id="smtp_user"
                        type="text"
                        value={payrollSettings?.smtp_user || ''}
                        onChange={(e) => handleSMTPUpdate('smtp_user', e.target.value)}
                        placeholder="your-email@example.com"
                        disabled={!isOwner}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp_password">SMTP Password</Label>
                      <Input
                        id="smtp_password"
                        type="password"
                        value={payrollSettings?.smtp_password || ''}
                        onChange={(e) => handleSMTPUpdate('smtp_password', e.target.value)}
                        placeholder="••••••••"
                        disabled={!isOwner}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp_from_email">From Email Address</Label>
                      <Input
                        id="smtp_from_email"
                        type="email"
                        value={payrollSettings?.smtp_from_email || ''}
                        onChange={(e) => handleSMTPUpdate('smtp_from_email', e.target.value)}
                        placeholder="payroll@yourcompany.com"
                        disabled={!isOwner}
                      />
                    </div>

                    <div>
                      <Label htmlFor="smtp_from_name">From Name</Label>
                      <Input
                        id="smtp_from_name"
                        type="text"
                        value={payrollSettings?.smtp_from_name || 'Payroll System'}
                        onChange={(e) => handleSMTPUpdate('smtp_from_name', e.target.value)}
                        placeholder="Payroll System"
                        disabled={!isOwner}
                      />
                    </div>
                  </CardContent>
                </Card>

                </>
              )}
            </TabsContent>

            {/* Audit Trail Tab */}
            {isOwner && (
              <TabsContent value="audit" className="space-y-6">
                <Card className="shadow-[var(--shadow-elegant)] border-border/50">
                  <CardHeader>
                    <CardTitle>Audit Trail</CardTitle>
                    <CardDescription>
                      Complete record of all company activities and changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={auditFilters.startDate}
                            onChange={(e) => setAuditFilters({ ...auditFilters, startDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={auditFilters.endDate}
                            onChange={(e) => setAuditFilters({ ...auditFilters, endDate: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>System/Module</Label>
                          <Select 
                            value={auditFilters.entityType} 
                            onValueChange={(value) => setAuditFilters({ ...auditFilters, entityType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All Systems" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              <ScrollArea className="h-full">
                                <SelectItem value="all">All Systems</SelectItem>
                                <SelectItem value="invoice">Invoices</SelectItem>
                                <SelectItem value="purchase">Purchases</SelectItem>
                                <SelectItem value="expense">Expenses</SelectItem>
                                <SelectItem value="inventory">Inventory</SelectItem>
                                <SelectItem value="employee">Employees</SelectItem>
                                <SelectItem value="payroll">Payroll</SelectItem>
                                <SelectItem value="contact">Contacts</SelectItem>
                                <SelectItem value="bank_account">Bank Accounts</SelectItem>
                                <SelectItem value="chart_of_accounts">Chart of Accounts</SelectItem>
                                <SelectItem value="settings">Settings</SelectItem>
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Action</Label>
                          <Select 
                            value={auditFilters.action} 
                            onValueChange={(value) => setAuditFilters({ ...auditFilters, action: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Actions</SelectItem>
                              <SelectItem value="create">Create</SelectItem>
                              <SelectItem value="update">Update</SelectItem>
                              <SelectItem value="delete">Delete</SelectItem>
                              <SelectItem value="view">View</SelectItem>
                              <SelectItem value="export">Export</SelectItem>
                              <SelectItem value="import">Import</SelectItem>
                              <SelectItem value="approve">Approve</SelectItem>
                              <SelectItem value="reject">Reject</SelectItem>
                              <SelectItem value="login">Login</SelectItem>
                              <SelectItem value="logout">Logout</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Summary and Actions */}
                      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Showing {filteredAuditLogs.length} of {auditLogs.length} total records
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAuditFilters({
                                startDate: '',
                                endDate: '',
                                entityType: 'all',
                                action: 'all',
                              });
                            }}
                          >
                            Clear Filters
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const { jsPDF } = await import('jspdf');
                              await import('jspdf-autotable');
                              
                              const doc = new jsPDF();
                              const pageWidth = doc.internal.pageSize.getWidth();
                              
                              // Title
                              doc.setFontSize(16);
                              doc.text('Audit Trail Report', pageWidth / 2, 15, { align: 'center' });
                              
                              // Company info
                              doc.setFontSize(10);
                              doc.text(`Company: ${activeCompany?.name || 'N/A'}`, 14, 25);
                              doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
                              
                              if (auditFilters.startDate || auditFilters.endDate) {
                                doc.text(
                                  `Period: ${auditFilters.startDate || 'Start'} to ${auditFilters.endDate || 'End'}`,
                                  14,
                                  35
                                );
                              }
                              
                              // Table
                              (doc as any).autoTable({
                                startY: auditFilters.startDate || auditFilters.endDate ? 40 : 35,
                                head: [['Date & Time', 'User', 'Action', 'System', 'Entity ID', 'Details']],
                                body: filteredAuditLogs.map((log) => [
                                  new Date(log.created_at).toLocaleString(),
                                  `${log.profiles?.full_name || 'Unknown'}\n${log.profiles?.email || ''}`,
                                  log.action,
                                  log.entity_type.replace('_', ' '),
                                  log.entity_id || '-',
                                  typeof log.details === 'object' 
                                    ? JSON.stringify(log.details).substring(0, 50) 
                                    : (log.details || '').substring(0, 50),
                                ]),
                                styles: { fontSize: 8, cellPadding: 2 },
                                headStyles: { fillColor: [66, 66, 66] },
                                columnStyles: {
                                  0: { cellWidth: 35 },
                                  1: { cellWidth: 30 },
                                  2: { cellWidth: 25 },
                                  3: { cellWidth: 25 },
                                  4: { cellWidth: 25 },
                                  5: { cellWidth: 'auto' },
                                },
                              });
                              
                              doc.save(`audit-trail-${new Date().toISOString().split('T')[0]}.pdf`);
                              toast({
                                title: 'Export successful',
                                description: 'Audit trail has been exported to PDF',
                              });
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export PDF
                          </Button>
                        </div>
                      </div>

                      {/* Audit Log Table */}
                      <ScrollArea className="h-[600px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>System</TableHead>
                              <TableHead>Entity ID</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAuditLogs.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                  No audit logs found
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredAuditLogs.map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell className="font-mono text-xs">
                                    {new Date(log.created_at).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{log.profiles?.full_name || 'Unknown User'}</span>
                                      <span className="text-xs text-muted-foreground">{log.profiles?.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                      {log.action}
                                    </span>
                                  </TableCell>
                                  <TableCell className="capitalize">{log.entity_type.replace('_', ' ')}</TableCell>
                                  <TableCell className="font-mono text-xs text-muted-foreground">
                                    {log.entity_id || '-'}
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    {log.details && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {typeof log.details === 'object' 
                                          ? JSON.stringify(log.details)
                                          : log.details}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
         </Tabs>
       </div>
       
       <CreateCompanyDialog open={showCreateCompanyDialog} onOpenChange={setShowCreateCompanyDialog} />
     </div>
   );
 }
