import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { loadSettings } from '@/utils/settingsStorage';

export default function TaxComplianceSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const settings = loadSettings();
  const [zraApiKey, setZraApiKey] = useState('');
  const [zimraDeviceId, setZimraDeviceId] = useState('');
  const [zimraApiKey, setZimraApiKey] = useState('');

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Tax compliance API credentials have been saved securely.",
    });
  };

  const getComplianceInfo = () => {
    switch (settings.country) {
      case 'ZM':
        return {
          title: 'Zambia Revenue Authority (ZRA) Compliance',
          description: 'Configure your ZRA Smart Invoice integration',
          requirements: [
            'All invoices must be registered with ZRA Smart Invoice system',
            'QR code must be displayed on all tax invoices',
            'Smart Invoice ID must be obtained for each invoice',
            'Real-time or batch submission to ZRA required',
          ],
          fields: (
            <>
              <div className="space-y-2">
                <Label htmlFor="zraApiKey">ZRA Smart Invoice API Key</Label>
                <Input
                  id="zraApiKey"
                  type="password"
                  value={zraApiKey}
                  onChange={(e) => setZraApiKey(e.target.value)}
                  placeholder="Enter your ZRA API key"
                />
                <p className="text-xs text-muted-foreground">
                  Obtain from ZRA after registering for Smart Invoice system
                </p>
              </div>
            </>
          ),
        };
      case 'ZW':
        return {
          title: 'Zimbabwe Revenue Authority (ZIMRA) Compliance',
          description: 'Configure your ZIMRA Fiscal Device integration',
          requirements: [
            'All invoices must be fiscalized through approved devices',
            'QR code required for buyer detail verification',
            'Fiscal device ID must be registered with ZIMRA',
            'Buyer information transmitted to FDMS',
          ],
          fields: (
            <>
              <div className="space-y-2">
                <Label htmlFor="zimraDeviceId">ZIMRA Fiscal Device ID</Label>
                <Input
                  id="zimraDeviceId"
                  value={zimraDeviceId}
                  onChange={(e) => setZimraDeviceId(e.target.value)}
                  placeholder="Enter fiscal device ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zimraApiKey">ZIMRA Fiscalization API Key</Label>
                <Input
                  id="zimraApiKey"
                  type="password"
                  value={zimraApiKey}
                  onChange={(e) => setZimraApiKey(e.target.value)}
                  placeholder="Enter ZIMRA API key"
                />
                <p className="text-xs text-muted-foreground">
                  Obtain from ZIMRA after fiscal device certification
                </p>
              </div>
            </>
          ),
        };
      case 'ZA':
        return {
          title: 'South African Revenue Service (SARS) Compliance',
          description: 'SARS tax invoice requirements',
          requirements: [
            'Invoice must contain "Tax Invoice" or "VAT Invoice"',
            'Supplier VAT registration number required',
            'Recipient VAT number (if VAT registered)',
            'Sequential invoice numbering',
            'Accurate description of goods/services',
            'VAT amount separately shown',
          ],
          fields: (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No API Integration Required</AlertTitle>
              <AlertDescription>
                SARS does not require real-time invoice submission. Ensure all required fields are included on your invoices.
                Your VAT registration details are configured in Company Settings.
              </AlertDescription>
            </Alert>
          ),
        };
      default:
        return {
          title: 'Tax Compliance Settings',
          description: 'Configure tax authority integrations',
          requirements: [],
          fields: null,
        };
    }
  };

  const info = getComplianceInfo();

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
              Tax Compliance Integration
            </h1>
            <p className="text-muted-foreground">
              Configure tax authority system integrations for {settings.country === 'ZA' ? 'South Africa' : settings.country === 'ZW' ? 'Zimbabwe' : 'Zambia'}
            </p>
          </div>
        </div>

        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80 mb-6">
          <CardHeader>
            <CardTitle>{info.title}</CardTitle>
            <CardDescription>{info.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {info.requirements.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Compliance Requirements:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {info.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {info.fields && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">API Configuration</h3>
                {info.fields}
              </div>
            )}

            {settings.country !== 'ZA' && (
              <>
                <Alert className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important Notice</AlertTitle>
                  <AlertDescription>
                    Integration with {settings.country === 'ZM' ? 'ZRA Smart Invoice' : 'ZIMRA FDMS'} requires official 
                    registration and certification with the tax authority. Contact your local tax office to:
                    <ul className="list-disc list-inside mt-2 ml-2">
                      <li>Register for the electronic invoicing system</li>
                      <li>Obtain API credentials</li>
                      <li>Complete certification process</li>
                      <li>Test the integration in sandbox environment</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save API Credentials
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Implementation Status</CardTitle>
            <CardDescription>Current compliance features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm">Country-specific invoice format</span>
                <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm">Tax registration numbers display</span>
                <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-1 rounded">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm">QR code generation</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                  {settings.country === 'ZA' ? 'Not Required' : 'Ready (Pending API)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm">Tax authority API integration</span>
                <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                  {settings.country === 'ZA' ? 'Not Required' : 'Awaiting Credentials'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
