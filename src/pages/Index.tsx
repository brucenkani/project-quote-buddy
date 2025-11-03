import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, Users, FileText, TrendingUp, Clock, Shield, CheckCircle, Mail, MessageCircle, Phone, ArrowRight, Binary, UserCircle, Headset, LineChart, BookOpen, GraduationCap, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


export default function Index() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Redirect authenticated users (both admin and non-admin) to dashboard
      if (session) {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: formData
      });

      if (emailError) throw emailError;

      // Also save to database for records
      const { error: dbError } = await supabase
        .from('contact_inquiries')
        .insert([formData]);

      if (dbError) console.error('Error saving to database:', dbError);

      toast.success('Thank you for your inquiry! We will get back to you soon.');
      setFormData({ name: '', email: '', company: '', phone: '', message: '' });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppContact = () => {
    const phoneNumber = '27659672215';
    const message = encodeURIComponent("Hi, I'm interested in learning more about BizManager's professional accounting services.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const handlePhoneCall = () => {
    window.location.href = 'tel:+27659672215';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">BizManager</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="lg" onClick={() => navigate('/community')}>Business Community</Button>
            <Button variant="ghost" size="lg" onClick={() => navigate('/knowledge')}>Knowledge Centre</Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Us
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card z-50">
                  <DropdownMenuItem onClick={handleWhatsAppContact} className="cursor-pointer">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <DialogTrigger className="w-full flex items-center cursor-pointer">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </DialogTrigger>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Contact Our Team</DialogTitle>
                  <DialogDescription>
                    Interested in our professional accounting services? Send us a message and we'll get back to you soon.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 px-1">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Your company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your accounting needs..."
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')} size="lg">
              {isAuthenticated ? 'Dashboard' : 'Sign In / Sign Up'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Combined with Professional Services */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Heading */}
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Professional Business Management Software
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Complete accounting, payroll, and CRM platform - <span className="font-bold text-primary">Completely Free!</span>
            </p>
          </div>

          {/* Professional Services Banner */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl border-2 border-primary/30 p-6 md:p-8">
            <div className="flex flex-col items-center gap-8">
              {/* System Cards inside banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full order-first">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-background" onClick={() => navigate('/accounting')}>
                  <CardHeader className="pb-3">
                    <Calculator className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle className="text-lg">Accounting System</CardTitle>
                    <CardDescription className="text-xs">
                      Complete financial management at your fingertips
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-background" onClick={() => navigate('/payroll')}>
                  <CardHeader className="pb-3">
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle className="text-lg">Payroll & HR System</CardTitle>
                    <CardDescription className="text-xs">
                      Simplify employee management and payroll
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-background" onClick={() => navigate('/crm-customer-support')}>
                  <CardHeader className="pb-3">
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <CardTitle className="text-lg">CRM & Customer Support</CardTitle>
                    <CardDescription className="text-xs">
                      Complete customer management & support system
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Message */}
              <div className="text-center w-full">
                <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  Systems 100% Free to Use
                </h3>
                <p className="text-base md:text-lg text-muted-foreground mb-4 max-w-2xl mx-auto">
                  Need professional help with <span className="font-semibold text-foreground">Financial Statements</span>, <span className="font-semibold text-foreground">Tax Returns</span>, or <span className="font-semibold text-foreground">Compliance Matters</span>?
                </p>
                <p className="text-base font-medium mb-6">
                  Contact me for expert assistance:
                </p>
                
                {/* Contact Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                  <Button 
                    size="lg" 
                    variant="default"
                    onClick={handleWhatsAppContact}
                    className="gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto"
                  >
                    <MessageCircle className="h-5 w-5" />
                    WhatsApp
                  </Button>
                  <Button 
                    size="lg" 
                    variant="default"
                    onClick={handlePhoneCall}
                    className="gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto"
                  >
                    <Phone className="h-5 w-5" />
                    Call Now
                  </Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg" 
                        variant="default"
                        className="gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto"
                      >
                        <Mail className="h-5 w-5" />
                        Email
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Contact Our Team</DialogTitle>
                        <DialogDescription>
                          Interested in our professional accounting services? Send us a message and we'll get back to you soon.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 px-1">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name *</Label>
                          <Input
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Your company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Your phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            required
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Tell us about your accounting needs..."
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-3 justify-end">
                          <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Contact Info */}
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium">+27 65 967 2215</p>
                  <p>bruce@nkani.co.za</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Services */}
      <section className="container mx-auto px-4 py-6">

        {/* Additional Services */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Websites & Excel Templates Shop */}
          <div className="flex items-center gap-6 p-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl border border-primary/20">
            <div className="flex-shrink-0 hidden sm:block">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Binary className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Websites & Excel Templates</h3>
              <p className="text-muted-foreground mb-4">
                Professional websites and custom Excel tools to streamline your business operations
              </p>
              <Button 
                variant="outline" 
                asChild
              >
                <a href="https://premwebs.com" target="_blank" rel="noopener noreferrer">
                  Visit Premwebs
                </a>
              </Button>
            </div>
          </div>

          {/* Report & Document Builders */}
          <div className="flex items-center gap-6 p-8 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-2xl border border-primary/20">
            <div className="flex-shrink-0 hidden sm:block">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Report & Document Builders</h3>
              <p className="text-muted-foreground mb-4">
                Custom reports, presentations, and professional documents tailored to your needs
              </p>
              <Button 
                variant="outline" 
                asChild
              >
                <a href="https://smebox.co.za" target="_blank" rel="noopener noreferrer">
                  Visit SMEBox
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
            <p>&copy; 2025 Nkani Business Solutions (Pty) Ltd. All rights reserved.</p>
            <div className="flex gap-6">
              <button onClick={() => navigate('/community')} className="hover:text-primary transition-colors">
                Business Community
              </button>
              <button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors">
                Terms & Conditions
              </button>
              <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors">
                Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
