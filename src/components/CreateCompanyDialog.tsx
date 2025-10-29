import { useState, useRef } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { countries } from '@/types/settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCompanyDialog({ open, onOpenChange }: CreateCompanyDialogProps) {
  const { createCompany, setActiveCompany } = useCompany();
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
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

  const selectedCountry = countries.find(c => c.code === formData.country);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    handleChange('logoUrl', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
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
  };

  const handleCreateCompany = async () => {
    if (!formData.companyName.trim()) return;
    
    setCreating(true);
    
    const settings = {
      country: formData.country,
      company_type: formData.companyType,
      currency: selectedCountry?.currency || 'ZAR',
      currency_symbol: selectedCountry?.symbol || 'R',
      email: formData.email || '',
      phone: formData.phone || '',
      address: formData.address || '',
      city: '',
      state: '',
      postal_code: '',
      tax_number: formData.vatNumber || '',
      registration_number: formData.companyRegistrationNumber || '',
      logo_url: formData.logoUrl || undefined,
      tax_rate: 15,
      financial_year_end: '02-28',
      invoice_prefix: 'INV',
      invoice_start_number: 1,
      quote_prefix: 'QTE',
      quote_start_number: 1,
      purchase_prefix: 'PO',
      purchase_start_number: 1,
    };

    const company = await createCompany(formData.companyName.trim(), settings);
    setCreating(false);
    
    if (company) {
      setActiveCompany(company);
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Create a new company to manage your accounting separately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4 overflow-y-auto flex-1 px-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Nkani Accounting & Tax"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name} ({country.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company-type">Company Type</Label>
              <Select value={formData.companyType} onValueChange={(value) => handleChange('companyType', value)}>
                <SelectTrigger id="company-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trading">Trading Company</SelectItem>
                  <SelectItem value="service">Service Company</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing Company</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+27 12 345 6789"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 Business St, City, Province, Postal Code"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Tax Registration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vat-number">{selectedCountry?.vatLabel || 'VAT Number'}</Label>
                <Input
                  id="vat-number"
                  value={formData.vatNumber}
                  onChange={(e) => handleChange('vatNumber', e.target.value)}
                  placeholder=""
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="income-tax-number">{selectedCountry?.incomeTaxLabel || 'Income Tax Reference Number'}</Label>
                <Input
                  id="income-tax-number"
                  value={formData.incomeTaxNumber}
                  onChange={(e) => handleChange('incomeTaxNumber', e.target.value)}
                  placeholder=""
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-reg-number">{selectedCountry?.companyRegLabel || 'Company Registration Number'}</Label>
              <Input
                id="company-reg-number"
                value={formData.companyRegistrationNumber}
                onChange={(e) => handleChange('companyRegistrationNumber', e.target.value)}
                placeholder=""
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Branding</h3>
            <div className="grid gap-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-center gap-2">
                {formData.logoUrl ? (
                  <div className="relative">
                    <img src={formData.logoUrl} alt="Company logo" className="h-16 w-16 object-contain border rounded" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="primary-color">Primary Brand Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary-color"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleChange('primaryColor', e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreateCompany} disabled={!formData.companyName.trim() || creating}>
            {creating ? 'Creating...' : 'Create Company'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
