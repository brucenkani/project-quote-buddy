import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, Globe, MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface CommunityMember {
  id: string;
  business_name: string;
  business_description: string;
  business_category: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  tagline?: string;
  is_featured: boolean;
  featured_until?: string;
  created_at: string;
}

interface CommunitySettings {
  featured_listing_fee: number;
  featured_duration_days: number;
}

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

export default function BusinessCommunity() {
  const [featuredMembers, setFeaturedMembers] = useState<CommunityMember[]>([]);
  const [regularMembers, setRegularMembers] = useState<CommunityMember[]>([]);
  const [settings, setSettings] = useState<CommunitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [formData, setFormData] = useState({
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommunityData();
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
      }
    }
  };

  const fetchCommunityData = async () => {
    try {
      // Fetch community settings
      const { data: settingsData } = await supabase
        .from('community_settings')
        .select('*')
        .single();
      
      if (settingsData) {
        setSettings(settingsData);
      }

      // Fetch all members
      const { data: members, error } = await supabase
        .from('community_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (members) {
        const now = new Date();
        const featured = members.filter(m => 
          m.is_featured && 
          m.featured_until && 
          new Date(m.featured_until) > now
        );
        const regular = members.filter(m => 
          !m.is_featured || 
          !m.featured_until || 
          new Date(m.featured_until) <= now
        );
        
        setFeaturedMembers(featured);
        setRegularMembers(regular);
      }
    } catch (error) {
      console.error('Error fetching community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user || !isOwner) {
      toast({
        title: 'Authentication Required',
        description: 'Only company owners can create a community profile',
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
      const { error } = await supabase
        .from('community_members')
        .insert([{
          company_id: companyId,
          user_id: user.id,
          ...formData
        }]);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'You have joined the Business Community'
      });

      setShowJoinDialog(false);
      fetchCommunityData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleGetFeatured = async (memberId: string) => {
    if (!user || !settings) return;

    try {
      // Create payment record
      const { data: payment, error } = await supabase
        .from('community_payments')
        .insert([{
          user_id: user.id,
          community_member_id: memberId,
          amount: settings.featured_listing_fee,
          payment_reference: `FEAT-${Date.now()}`,
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Redirect to PayFast payment page (implementation depends on PayFast integration)
      toast({
        title: 'Payment Required',
        description: `Please complete payment of R${settings.featured_listing_fee} to become a featured member`
      });

      // TODO: Integrate PayFast payment gateway
      // For now, showing a placeholder
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">BizCounting</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button variant="outline" onClick={() => navigate('/auth')}>Sign In</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Business Community
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Connect, collaborate, and grow with fellow business professionals
          </p>
          {isOwner && (
            <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <Building2 className="h-5 w-5" />
                  Join the Community
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Join the Business Community</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="business_category">Business Category *</Label>
                  <Select
                    value={formData.business_category}
                    onValueChange={(value) => setFormData({...formData, business_category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {businessCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                    placeholder="Brief description of what you do (optional)"
                    maxLength={100}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="business_description">Business Description</Label>
                  <Textarea
                    id="business_description"
                    value={formData.business_description}
                    onChange={(e) => setFormData({...formData, business_description: e.target.value})}
                    rows={4}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <Button onClick={handleJoinCommunity}>Submit</Button>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </section>

      {/* Featured Members */}
      {featuredMembers.length > 0 && (
        <section className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-3xl font-bold text-center">Featured Community Members</h2>
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMembers.map((member) => (
                <Card 
                  key={member.id} 
                  className="border-2 border-yellow-500/50 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-yellow-500"
                  onClick={() => setSelectedMember(member)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          {member.business_name}
                        </CardTitle>
                        <Badge className="mt-2 bg-yellow-500">{member.business_category}</Badge>
                        {member.tagline && (
                          <p className="text-sm text-muted-foreground italic mt-3">{member.tagline}</p>
                        )}
                      </div>
                      <Star className="h-6 w-6 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regular Members */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2">Community Members</h2>
          {settings && (
            <p className="text-center text-muted-foreground mb-8">
              Want to be featured? Become a featured member for only R{settings.featured_listing_fee} for {settings.featured_duration_days} days
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularMembers.map((member) => (
              <Card 
                key={member.id} 
                className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/40"
                onClick={() => setSelectedMember(member)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {member.business_name}
                      </CardTitle>
                      <Badge variant="outline" className="mt-2">{member.business_category}</Badge>
                      {member.tagline && (
                        <p className="text-sm text-muted-foreground italic mt-3 line-clamp-2">{member.tagline}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Member Details Dialog */}
      <Dialog open={selectedMember !== null} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {selectedMember?.business_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <Badge className={selectedMember.is_featured ? "bg-yellow-500" : ""}>
                  {selectedMember.business_category}
                </Badge>
              </div>

              {selectedMember.tagline && (
                <p className="text-lg italic text-muted-foreground border-l-4 border-primary pl-4">
                  {selectedMember.tagline}
                </p>
              )}
              
              <div>
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-muted-foreground">{selectedMember.business_description || 'No description provided.'}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Contact Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedMember.contact_email}`} className="hover:underline">
                      {selectedMember.contact_email}
                    </a>
                  </div>
                  {selectedMember.contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <a href={`tel:${selectedMember.contact_phone}`} className="hover:underline">
                        {selectedMember.contact_phone}
                      </a>
                    </div>
                  )}
                  {selectedMember.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={selectedMember.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {selectedMember.website}
                      </a>
                    </div>
                  )}
                  {(selectedMember.address || selectedMember.city) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{[selectedMember.address, selectedMember.city].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 BizCounting. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Button variant="link" onClick={() => navigate('/terms')}>Terms & Conditions</Button>
            <Button variant="link" onClick={() => navigate('/privacy')}>Privacy Policy</Button>
          </div>
        </div>
      </footer>
    </div>
  );
}