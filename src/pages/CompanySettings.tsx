import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Upload, X, Building2 } from 'lucide-react';
import { countries } from '@/types/settings';
import { useSettings } from '@/contexts/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const businessCategories = [
  'Accounting & Finance',
  'Construction',
  'Consulting',
  'Education',
  'Healthcare',
  'IT & Technology',
  'Legal Services',
  'Manufacturing',
  'Marketing & Advertising',
  'Real Estate',
  'Retail',
  'Transportation',
  'Other'
];

export default function CompanySettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings, loading, saveSettings: saveToContext } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [communityProfile, setCommunityProfile] = useState({
    business_name: '',
    business_description: '',
    business_category: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    address: '',
    city: '',
    tagline: ''
  });
  const [hasCommunityProfile, setHasCommunityProfile] = useState(false);
  const [communityMemberId, setCommunityMemberId] = useState<string | null>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      // Check if user is owner
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single();
      
      setIsOwner(!!roleData);
      
      // Get user's company
      const { data: memberData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      if (memberData) {
        setCompanyId(memberData.company_id);
        loadCommunityProfile(memberData.company_id);
      }
    }
  };

  const loadCommunityProfile = async (company_id: string) => {
    const { data, error } = await supabase
      .from('community_members')
      .select('*')
      .eq('company_id', company_id)
      .single();

    if (data && !error) {
      setCommunityProfile({
        business_name: data.business_name || '',
        business_description: data.business_description || '',
        business_category: data.business_category || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        website: data.website || '',
        address: data.address || '',
        city: data.city || '',
        tagline: data.tagline || ''
      });
      setHasCommunityProfile(true);
      setCommunityMemberId(data.id);
    }
  };

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

  const handleSave = async () => {
    try {
      await saveToContext(localSettings);
      toast({
        title: "Settings saved",
        description: "Your company settings have been updated successfully and will apply to both Accounting and Payroll systems.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveCommunityProfile = async () => {
    if (!user || !isOwner) {
      toast({
        title: 'Permission Denied',
        description: 'Only company owners can manage the community profile',
        variant: 'destructive'
      });
      return;
    }

    if (!companyId) {
      toast({
        title: 'Error',
        description: 'No company found for your account',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (hasCommunityProfile && communityMemberId) {
        // Update existing profile
        const { error } = await supabase
          .from('community_members')
          .update({
            business_name: communityProfile.business_name,
            business_description: communityProfile.business_description,
            business_category: communityProfile.business_category,
            contact_email: communityProfile.contact_email,
            contact_phone: communityProfile.contact_phone,
            website: communityProfile.website,
            address: communityProfile.address,
            city: communityProfile.city,
            tagline: communityProfile.tagline
          })
          .eq('id', communityMemberId);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('community_members')
          .insert([{
            company_id: companyId,
            user_id: user.id,
            ...communityProfile
          }]);

        if (error) throw error;
        setHasCommunityProfile(true);
      }

      toast({
        title: 'Success!',
        description: 'Your community profile has been updated'
      });
      if (companyId) {
        loadCommunityProfile(companyId);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
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
                <p className="text-xs text-muted-foreground">
                  Currency will be automatically set based on country
                </p>
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

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={localSettings.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="www.yourcompany.com"
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
              <h3 className="text-lg font-semibold mb-4">Tax Registration Details</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter your tax registration numbers as required by {selectedCountry?.name} authorities
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vatNumber">{selectedCountry?.vatLabel || 'VAT Number'}</Label>
                  <Input
                    id="vatNumber"
                    value={localSettings.vatNumber || ''}
                    onChange={(e) => handleChange('vatNumber', e.target.value)}
                    placeholder={
                      localSettings.country === 'ZA' ? 'e.g., 4123456789' :
                      localSettings.country === 'ZW' ? 'e.g., 10123456' :
                      'e.g., 1234567890'
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="incomeTaxNumber">{selectedCountry?.incomeTaxLabel || 'Income Tax Number'}</Label>
                  <Input
                    id="incomeTaxNumber"
                    value={localSettings.incomeTaxNumber || ''}
                    onChange={(e) => handleChange('incomeTaxNumber', e.target.value)}
                    placeholder={
                      localSettings.country === 'ZA' ? 'e.g., 9876543210' :
                      localSettings.country === 'ZW' ? 'e.g., 123456789' :
                      'e.g., 1234567890'
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyRegistrationNumber">{selectedCountry?.companyRegLabel || 'Company Registration Number'}</Label>
                  <Input
                    id="companyRegistrationNumber"
                    value={localSettings.companyRegistrationNumber || ''}
                    onChange={(e) => handleChange('companyRegistrationNumber', e.target.value)}
                    placeholder={
                      localSettings.country === 'ZA' ? 'e.g., 2023/123456/07 or K2023123456' :
                      localSettings.country === 'ZW' ? 'e.g., 123/2023' :
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
                    {localSettings.logoUrl ? (
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
                        {localSettings.logoUrl ? 'Change Logo' : 'Upload Logo'}
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
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {isOwner && (
        <Card className="shadow-[var(--shadow-elegant)] border-border/50 backdrop-blur-sm bg-card/80 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Community Profile
            </CardTitle>
            <CardDescription>
              Manage your business listing in the BizManager Business Community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="community_business_name">Business Name *</Label>
                <Input
                  id="community_business_name"
                  value={communityProfile.business_name}
                  onChange={(e) => setCommunityProfile({...communityProfile, business_name: e.target.value})}
                  placeholder="Your business name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="community_business_category">Business Category *</Label>
                <Select
                  value={communityProfile.business_category}
                  onValueChange={(value) => setCommunityProfile({...communityProfile, business_category: value})}
                >
                  <SelectTrigger id="community_business_category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="community_tagline">Tagline</Label>
                <Input
                  id="community_tagline"
                  value={communityProfile.tagline}
                  onChange={(e) => setCommunityProfile({...communityProfile, tagline: e.target.value})}
                  placeholder="Brief description of what you do"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  A short catchphrase that appears on your community card
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="community_business_description">Business Description</Label>
                <Textarea
                  id="community_business_description"
                  value={communityProfile.business_description}
                  onChange={(e) => setCommunityProfile({...communityProfile, business_description: e.target.value})}
                  rows={4}
                  placeholder="Describe what your business does, your services, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="community_contact_email">Contact Email *</Label>
                <Input
                  id="community_contact_email"
                  type="email"
                  value={communityProfile.contact_email}
                  onChange={(e) => setCommunityProfile({...communityProfile, contact_email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="community_contact_phone">Contact Phone</Label>
                <Input
                  id="community_contact_phone"
                  type="tel"
                  value={communityProfile.contact_phone}
                  onChange={(e) => setCommunityProfile({...communityProfile, contact_phone: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="community_website">Website</Label>
                <Input
                  id="community_website"
                  type="url"
                  value={communityProfile.website}
                  onChange={(e) => setCommunityProfile({...communityProfile, website: e.target.value})}
                  placeholder="https://www.yourwebsite.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="community_city">City</Label>
                <Input
                  id="community_city"
                  value={communityProfile.city}
                  onChange={(e) => setCommunityProfile({...communityProfile, city: e.target.value})}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="community_address">Address</Label>
                <Input
                  id="community_address"
                  value={communityProfile.address}
                  onChange={(e) => setCommunityProfile({...communityProfile, address: e.target.value})}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveCommunityProfile} className="gap-2">
                <Save className="h-4 w-4" />
                {hasCommunityProfile ? 'Update Community Profile' : 'Create Community Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
