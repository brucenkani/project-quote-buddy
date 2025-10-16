import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { countries } from '@/types/settings';
import { loadSettings, saveSettings as saveLocalSettings } from '@/utils/settingsStorage';
import { loadChartOfAccounts, saveChartOfAccounts } from '@/utils/chartOfAccountsStorage';
import { generateChartOfAccountsPDF, generateChartOfAccountsExcel } from '@/utils/chartOfAccountsReports';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Save, Upload, X, FileDown, FileSpreadsheet, Database, Shield } from 'lucide-react';

export default function LandingSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings: contextSettings, loading, saveSettings: saveToContext } = useSettings();
  const [localSettings, setLocalSettings] = useState(contextSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const selectedCountry = countries.find(c => c.code === localSettings.country);

  const handleChange = (field: keyof typeof localSettings, value: string | number) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
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

  const handleSaveAccountingSettings = () => {
    const updatedSettings = {
      ...localSettings,
      taxRate,
      invoicePrefix,
      invoiceStartNumber,
      quotePrefix,
      quoteStartNumber,
      purchasePrefix,
      purchaseStartNumber,
    };
    saveLocalSettings(updatedSettings);
    setLocalSettings(updatedSettings);
    
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company">Company Settings</TabsTrigger>
            <TabsTrigger value="accounting">Accounting Settings</TabsTrigger>
            <TabsTrigger value="payroll">Payroll & HR Settings</TabsTrigger>
          </TabsList>

          {/* Company Settings Tab */}
          <TabsContent value="company" className="space-y-6">
            <Card className="shadow-[var(--shadow-elegant)] border-border/50">
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Global company details used across all systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={localSettings.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      placeholder="Your Company Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={localSettings.country}
                      onValueChange={(value) => {
                        const country = countries.find(c => c.code === value);
                        if (country) {
                          setLocalSettings(prev => ({
                            ...prev,
                            country: country.code,
                            currency: country.currency,
                            currencySymbol: country.symbol,
                          }));
                        }
                      }}
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
                      value={localSettings.companyType}
                      onValueChange={(value) => handleChange('companyType', value)}
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
                      value={localSettings.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={localSettings.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+27 12 345 6789"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={localSettings.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="123 Business St, City, Province, Postal Code"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Tax Registration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vatNumber">{selectedCountry?.vatLabel || 'VAT Number'}</Label>
                      <Input
                        id="vatNumber"
                        value={localSettings.vatNumber || ''}
                        onChange={(e) => handleChange('vatNumber', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="incomeTaxNumber">{selectedCountry?.incomeTaxLabel || 'Tax Number'}</Label>
                      <Input
                        id="incomeTaxNumber"
                        value={localSettings.incomeTaxNumber || ''}
                        onChange={(e) => handleChange('incomeTaxNumber', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="companyRegistrationNumber">{selectedCountry?.companyRegLabel || 'Registration Number'}</Label>
                      <Input
                        id="companyRegistrationNumber"
                        value={localSettings.companyRegistrationNumber || ''}
                        onChange={(e) => handleChange('companyRegistrationNumber', e.target.value)}
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
                        {localSettings.logoUrl && (
                          <div className="relative">
                            <img 
                              src={localSettings.logoUrl} 
                              alt="Company logo" 
                              className="h-24 w-auto object-contain border rounded-lg p-2"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6"
                              onClick={removeLogo}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {localSettings.logoUrl ? 'Change Logo' : 'Upload Logo'}
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
                          value={localSettings.primaryColor}
                          onChange={(e) => handleChange('primaryColor', e.target.value)}
                          className="w-20 h-10"
                        />
                        <Input
                          value={localSettings.primaryColor}
                          onChange={(e) => handleChange('primaryColor', e.target.value)}
                          placeholder="#3b82f6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveCompanySettings} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Company Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                  Download your chart of accounts and manage opening balances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
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
                          Enter opening balances for each account
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
                </div>
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
            <Card className="shadow-[var(--shadow-elegant)] border-border/50">
              <CardHeader>
                <CardTitle>Payroll & HR Settings</CardTitle>
                <CardDescription>
                  Configure payroll and HR-specific preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Payroll settings are available from the Payroll dashboard
                </p>
                <Button onClick={() => navigate('/payroll/settings')} variant="outline">
                  Go to Payroll Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
