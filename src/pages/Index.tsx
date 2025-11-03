import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, Users, FileText, TrendingUp, Clock, Shield, CheckCircle, Mail, MessageCircle, Phone, ArrowRight, Binary, UserCircle, Headset, LineChart, BookOpen, GraduationCap, ChevronDown, Menu } from 'lucide-react';
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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold">BizManager</h1>
          </div>
          
          {/* Desktop Navigation - hidden on tablets and below */}
          <div className="hidden lg:flex gap-3 items-center">
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
                  <DropdownMenuItem onClick={handlePhoneCall} className="cursor-pointer">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
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

          {/* Mobile/Tablet Navigation - visible on lg screens and below */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate('/community');
                  }}
                >
                  Business Community
                </Button>
                <Button 
                  variant="ghost" 
                  className="justify-start" 
                  onClick={() => {
                    navigate('/knowledge');
                  }}
                >
                  Knowledge Centre
                </Button>
                
                <div className="border-t pt-4 mt-2">
                  <p className="text-sm font-medium mb-3 px-2">Contact Us</p>
                  <Button 
                    variant="ghost" 
                    className="justify-start w-full" 
                    onClick={handleWhatsAppContact}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start w-full" 
                    onClick={handlePhoneCall}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="justify-start w-full">
                        <Mail className="h-4 w-4 mr-2" />
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
                          <Label htmlFor="mobile-name">Name *</Label>
                          <Input
                            id="mobile-name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobile-email">Email *</Label>
                          <Input
                            id="mobile-email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobile-company">Company</Label>
                          <Input
                            id="mobile-company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Your company name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobile-phone">Phone</Label>
                          <Input
                            id="mobile-phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Your phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mobile-message">Message *</Label>
                          <Textarea
                            id="mobile-message"
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

                <div className="border-t pt-4 mt-2">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth')}
                  >
                    {isAuthenticated ? 'Dashboard' : 'Sign In / Sign Up'}
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
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
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl border-2 border-primary/30 p-6 md:p-8 relative">
            <div className="flex flex-col items-center gap-8">
              {/* System Cards inside banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full order-first">
                <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800" onClick={() => navigate('/accounting')}>
                  <CardHeader className="pb-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center mb-3">
                      <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg">Accounting System</CardTitle>
                    <CardDescription className="text-xs">
                      Complete financial management at your fingertips
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800" onClick={() => navigate('/payroll')}>
                  <CardHeader className="pb-3">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-lg">Payroll & HR System</CardTitle>
                    <CardDescription className="text-xs">
                      Simplify employee management and payroll
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800" onClick={() => navigate('/crm-customer-support')}>
                  <CardHeader className="pb-3">
                    <div className="h-12 w-12 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mb-3">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg">CRM & Customer Support</CardTitle>
                    <CardDescription className="text-xs">
                      Complete customer management & support system
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>

              {/* Message and Contact Section */}
              <div className="text-center w-full">
                <h3 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center gap-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  Systems 100% Free to Use
                </h3>
                <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Need professional help with <span className="font-semibold text-foreground">Financial Statements</span>, <span className="font-semibold text-foreground">Tax Returns</span>, or <span className="font-semibold text-foreground">Compliance Matters</span>?
                </p>
                
                {/* Cards and Contact Info Section */}
                <div className="flex flex-col lg:flex-row items-center justify-center gap-6 mb-8">
                  {/* Left Card - Websites & Excel Templates */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 w-full max-w-[300px]">
                    <CardHeader className="pb-3">
                      <div className="h-12 w-12 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center mb-3">
                        <Binary className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <CardTitle className="text-lg">Websites & Excel Templates</CardTitle>
                      <CardDescription className="text-xs">
                        Professional websites and custom Excel tools
                      </CardDescription>
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="mt-3 border-orange-300 dark:border-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                      >
                        <a href="https://premwebs.com" target="_blank" rel="noopener noreferrer">
                          Visit Premwebs
                        </a>
                      </Button>
                    </CardHeader>
                  </Card>

                  {/* Contact Info - Center */}
                  <div className="text-base text-muted-foreground space-y-1 lg:mx-8">
                    <p className="font-medium">Contact me for expert assistance:</p>
                    <p className="font-semibold text-lg text-foreground mt-2">+27 65 967 2215</p>
                    <p className="text-foreground">bruce@nkani.co.za</p>
                  </div>

                  {/* Right Card - Report & Document Builders */}
                  <Card className="cursor-pointer hover:shadow-lg transition-all bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 border-teal-200 dark:border-teal-800 w-full max-w-[300px]">
                    <CardHeader className="pb-3">
                      <div className="h-12 w-12 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center mb-3">
                        <FileText className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <CardTitle className="text-lg">Report & Document Builders</CardTitle>
                      <CardDescription className="text-xs">
                        Custom reports and professional documents
                      </CardDescription>
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        className="mt-3 border-teal-300 dark:border-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900/30"
                      >
                        <a href="https://smebox.co.za" target="_blank" rel="noopener noreferrer">
                          Visit SMEBox
                        </a>
                      </Button>
                    </CardHeader>
                  </Card>
                </div>
              </div>
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
