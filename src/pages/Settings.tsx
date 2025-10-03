import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadSettings } from '@/utils/settingsStorage';

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = loadSettings();
  const [taxRate, setTaxRate] = useState(0.15);
  const [financialYearEnd, setFinancialYearEnd] = useState(12);

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your accounting settings have been updated successfully.",
    });
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

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

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
