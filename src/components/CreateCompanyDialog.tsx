import { useState } from 'react';
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

interface CreateCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCompanyDialog({ open, onOpenChange }: CreateCompanyDialogProps) {
  const { createCompany, setActiveCompany } = useCompany();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    country: 'ZA',
    companyType: 'trading',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCompany = async () => {
    if (!formData.companyName.trim()) return;
    
    setCreating(true);
    
    const selectedCountry = countries.find(c => c.code === formData.country);
    const settings = {
      country: formData.country,
      company_type: formData.companyType,
      currency: selectedCountry?.currency || 'ZAR',
      currency_symbol: selectedCountry?.symbol || 'R',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      tax_number: '',
      registration_number: '',
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
      setFormData({
        companyName: '',
        country: 'ZA',
        companyType: 'trading',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Create a new company to manage your accounting separately.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Enter company name"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateCompany();
              }}
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
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-type">Company Type</Label>
            <Select value={formData.companyType} onValueChange={(value) => handleChange('companyType', value)}>
              <SelectTrigger id="company-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trading">Trading</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFormData({
                companyName: '',
                country: 'ZA',
                companyType: 'trading',
              });
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
