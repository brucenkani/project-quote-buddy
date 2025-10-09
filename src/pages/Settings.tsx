import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Save, Shield, FileDown, FileSpreadsheet, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadSettings, saveSettings } from '@/utils/settingsStorage';
import { loadChartOfAccounts, saveChartOfAccounts } from '@/utils/chartOfAccountsStorage';
import { generateChartOfAccountsPDF, generateChartOfAccountsExcel } from '@/utils/chartOfAccountsReports';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState(() => loadSettings());
  const [taxRate, setTaxRate] = useState(settings.taxRate || 0.15);
  const [financialYearEnd, setFinancialYearEnd] = useState(12);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || 'INV-');
  const [invoiceStartNumber, setInvoiceStartNumber] = useState(settings.invoiceStartNumber || 1);
  const [quotePrefix, setQuotePrefix] = useState(settings.quotePrefix || 'QT-');
  const [quoteStartNumber, setQuoteStartNumber] = useState(settings.quoteStartNumber || 1);
  const [purchasePrefix, setPurchasePrefix] = useState(settings.purchasePrefix || 'PO-');
  const [purchaseStartNumber, setPurchaseStartNumber] = useState(settings.purchaseStartNumber || 1);
  const [accounts, setAccounts] = useState(() => loadChartOfAccounts());
  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>({});
  const [showOpeningBalances, setShowOpeningBalances] = useState(false);

  const handleSave = () => {
    const updatedSettings = {
      ...settings,
      taxRate,
      invoicePrefix,
      invoiceStartNumber,
      quotePrefix,
      quoteStartNumber,
      purchasePrefix,
      purchaseStartNumber,
    };
    saveSettings(updatedSettings);
    
    // Save opening balances to accounts
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      openingBalance: openingBalances[acc.id] || acc.openingBalance || 0
    }));
    saveChartOfAccounts(updatedAccounts);
    setAccounts(updatedAccounts);
    
    toast({
      title: "Settings saved",
      description: "Your accounting settings have been updated successfully.",
    });
  };

  const handleDownloadPDF = () => {
    generateChartOfAccountsPDF(accounts);
    toast({
      title: "PDF Downloaded",
      description: "Chart of accounts has been exported to PDF.",
    });
  };

  const handleDownloadExcel = () => {
    generateChartOfAccountsExcel(accounts);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/accounting')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Accounting Settings
            </h1>
            <p className="text-muted-foreground">
              Configure accounting-specific preferences
            </p>
          </div>
        </div>

        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80 mb-6">
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
                <p className="text-xs text-muted-foreground">
                  This rate will be applied by default to all invoices and quotes
                </p>
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
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sets the end month for your accounting year
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80 mb-6">
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
                      handleSave();
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

        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80 mb-6">
          <CardHeader>
            <CardTitle>Document Sequence Numbers</CardTitle>
            <CardDescription>
              Configure starting numbers and prefixes for your documents
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

        <div className="flex justify-end mb-6">
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save All Settings
          </Button>
        </div>

        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Tax Compliance Integration</CardTitle>
            <CardDescription>
              Configure tax authority requirements for {settings.country === 'ZA' ? 'South Africa (SARS)' : settings.country === 'ZW' ? 'Zimbabwe (ZIMRA)' : 'Zambia (ZRA)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manage invoice compliance settings, QR codes, and tax authority API integrations.
            </p>
            <Button onClick={() => navigate('/tax-compliance')} className="gap-2">
              <Shield className="h-4 w-4" />
              Configure Tax Compliance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
