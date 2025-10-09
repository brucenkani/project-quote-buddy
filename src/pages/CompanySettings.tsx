import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { type CompanySettings, countries } from '@/types/settings';
import { loadSettings, saveSettings } from '@/utils/settingsStorage';
import { useToast } from '@/hooks/use-toast';

export default function CompanySettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<CompanySettings>(loadSettings());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = countries.find(c => c.code === settings.country);

  const handleChange = (field: keyof CompanySettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setSettings(prev => ({ ...prev, logoUrl: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    toast({
      title: "Settings saved",
      description: "Your company settings have been updated successfully and will apply to both Accounting and Payroll systems.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/landing')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
              Company Settings
            </h1>
            <p className="text-muted-foreground">
              Global settings that apply to both Accounting and Payroll systems
            </p>
          </div>
        </div>

        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              This information will appear across all modules including quotes, invoices, and payslips
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={settings.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="Your Company Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={settings.country}
                  onValueChange={(value) => {
                    const country = countries.find(c => c.code === value);
                    if (country) {
                      setSettings(prev => ({
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
                <p className="text-xs text-muted-foreground">
                  Currency will be automatically set based on country
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyType">Company Type</Label>
                <Select
                  value={settings.companyType}
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
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+27 12 345 6789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={settings.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="www.yourcompany.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="123 Business St, City, Province, Postal Code"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Tax Registration Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your tax registration numbers as required by {selectedCountry?.name} authorities
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">{selectedCountry?.vatLabel || 'VAT Number'}</Label>
                  <Input
                    id="vatNumber"
                    value={settings.vatNumber || ''}
                    onChange={(e) => handleChange('vatNumber', e.target.value)}
                    placeholder={
                      settings.country === 'ZA' ? 'e.g., 4123456789' :
                      settings.country === 'ZW' ? 'e.g., 10123456' :
                      'e.g., 1234567890'
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incomeTaxNumber">{selectedCountry?.incomeTaxLabel || 'Income Tax Number'}</Label>
                  <Input
                    id="incomeTaxNumber"
                    value={settings.incomeTaxNumber || ''}
                    onChange={(e) => handleChange('incomeTaxNumber', e.target.value)}
                    placeholder={
                      settings.country === 'ZA' ? 'e.g., 9876543210' :
                      settings.country === 'ZW' ? 'e.g., 123456789' :
                      'e.g., 1234567890'
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyRegistrationNumber">{selectedCountry?.companyRegLabel || 'Company Registration Number'}</Label>
                  <Input
                    id="companyRegistrationNumber"
                    value={settings.companyRegistrationNumber || ''}
                    onChange={(e) => handleChange('companyRegistrationNumber', e.target.value)}
                    placeholder={
                      settings.country === 'ZA' ? 'e.g., 2023/123456/07 or K2023123456' :
                      settings.country === 'ZW' ? 'e.g., 123/2023' :
                      'e.g., 123456'
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Branding</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-start gap-4">
                    {settings.logoUrl ? (
                      <div className="relative">
                        <img 
                          src={settings.logoUrl} 
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
                    ) : null}
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
                        {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Recommended: PNG or SVG, max 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>
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
      </div>
    </div>
  );
}
