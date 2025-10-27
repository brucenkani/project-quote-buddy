import { useState, useEffect } from 'react';
import { PayrollNavigation } from '@/components/PayrollNavigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PayrollSettings {
  id: string;
  country: string;
  currency: string;
  currency_symbol: string;
  current_tax_year: number;
}

interface TaxBracket {
  id: string;
  year: number;
  country: string;
  age_group: string;
  bracket_min: number;
  bracket_max: number | null;
  rate: number;
  threshold: number;
  rebate: number;
}

const countries = [
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL', symbol: '$' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', symbol: 'K' },
];

export default function PayrollSettings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);
  const [newBracket, setNewBracket] = useState({
    age_group: 'under_65',
    bracket_min: 0,
    bracket_max: null as number | null,
    rate: 0,
    threshold: 0,
    rebate: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    loadData();
  };

  const loadData = async () => {
    try {
      // Try to fetch a single settings row (table is global, not per company)
      let { data: settingsData } = await supabase
        .from('payroll_settings')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!settingsData) {
        // Check if current user is an owner; only owners can create settings
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        let isOwner = false;
        if (userId) {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId);
          isOwner = (roles || []).some((r: any) => r.role === 'owner');
        }

        if (isOwner) {
          const { data: newSettings, error: insertError } = await supabase
            .from('payroll_settings')
            .insert([{
              country: 'ZA',
              currency: 'ZAR',
              currency_symbol: 'R',
              current_tax_year: new Date().getFullYear(),
            }])
            .select()
            .single();
          if (insertError) throw insertError;
          settingsData = newSettings;
        } else {
          // Fallback to read-only defaults so the UI doesn't get stuck
          settingsData = {
            id: 'readonly',
            country: 'ZA',
            currency: 'ZAR',
            currency_symbol: 'R',
            current_tax_year: new Date().getFullYear(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;
        }
      }

      setSettings(settingsData);
      loadTaxBrackets(settingsData.country, settingsData.current_tax_year);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payroll settings',
        variant: 'destructive',
      });
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

  const handleCountryChange = async (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (!country || !settings) return;

    const { error } = await supabase
      .from('payroll_settings')
      .update({
        country: countryCode,
        currency: country.currency,
        currency_symbol: country.symbol,
      })
      .eq('id', settings.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update country settings',
        variant: 'destructive',
      });
      return;
    }

    setSettings({
      ...settings,
      country: countryCode,
      currency: country.currency,
      currency_symbol: country.symbol,
    });

    loadTaxBrackets(countryCode, settings.current_tax_year);

    toast({
      title: 'Success',
      description: 'Country and currency updated',
    });
  };

  const handleTaxYearChange = async (year: string) => {
    if (!settings) return;

    const { error } = await supabase
      .from('payroll_settings')
      .update({ current_tax_year: parseInt(year) })
      .eq('id', settings.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tax year',
        variant: 'destructive',
      });
      return;
    }

    setSettings({ ...settings, current_tax_year: parseInt(year) });
    loadTaxBrackets(settings.country, parseInt(year));

    toast({
      title: 'Success',
      description: 'Tax year updated',
    });
  };

  const handleAddBracket = async () => {
    if (!settings) return;

    const { error } = await supabase
      .from('tax_brackets')
      .insert([{
        ...newBracket,
        year: settings.current_tax_year,
        country: settings.country,
      }]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add tax bracket',
        variant: 'destructive',
      });
      return;
    }

    loadTaxBrackets(settings.country, settings.current_tax_year);
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

    if (settings) {
      loadTaxBrackets(settings.country, settings.current_tax_year);
    }

    toast({
      title: 'Success',
      description: 'Tax bracket deleted',
    });
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
        <PayrollNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading payroll settings...</div>
        </div>
      </div>
    );
  }

  const currentCountry = countries.find(c => c.code === settings.country);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <PayrollNavigation />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
            Payroll Settings
          </h1>
          <p className="text-muted-foreground">Configure country, currency, and tax brackets</p>
        </div>

        <div className="grid gap-6">
          {/* Country & Currency Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Country & Currency</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Country</Label>
                <Select value={settings.country} onValueChange={handleCountryChange}>
                  <SelectTrigger>
                    <SelectValue />
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

              <div>
                <Label>Currency</Label>
                <Input value={settings.currency} disabled />
              </div>

              <div>
                <Label>Symbol</Label>
                <Input value={settings.currency_symbol} disabled />
              </div>
            </div>
          </Card>

          {/* Tax Year */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tax Year Configuration</h2>
            <div className="max-w-xs">
              <Label>Current Tax Year</Label>
              <Select 
                value={settings.current_tax_year.toString()} 
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
          </Card>

          {/* Tax Brackets */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Tax Brackets - {currentCountry?.name} ({settings.current_tax_year}/{settings.current_tax_year + 1})
            </h2>
            
            {/* Add New Bracket */}
            <div className="mb-6 p-4 bg-secondary/20 rounded-lg">
              <h3 className="font-medium mb-3">Add New Tax Bracket</h3>
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
                  <Button onClick={handleAddBracket} size="sm" className="h-9 w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Brackets */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Age Group</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Maximum</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Rebate</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxBrackets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No tax brackets configured for this year. Add one above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    taxBrackets.map((bracket) => (
                      <TableRow key={bracket.id}>
                        <TableCell className="capitalize">
                          {bracket.age_group.replace('_', ' ')}
                        </TableCell>
                        <TableCell>{settings.currency_symbol}{bracket.bracket_min.toLocaleString()}</TableCell>
                        <TableCell>
                          {bracket.bracket_max 
                            ? `${settings.currency_symbol}${bracket.bracket_max.toLocaleString()}`
                            : 'No limit'
                          }
                        </TableCell>
                        <TableCell>{bracket.rate}%</TableCell>
                        <TableCell>{settings.currency_symbol}{bracket.threshold.toLocaleString()}</TableCell>
                        <TableCell>{settings.currency_symbol}{bracket.rebate.toLocaleString()}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBracket(bracket.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

