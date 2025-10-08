import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calculator, Users, FileText, TrendingUp, Clock, Shield, CheckCircle, Mail, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Index() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_inquiries')
        .insert([formData]);

      if (error) throw error;

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
    const message = encodeURIComponent("Hi, I'm interested in learning more about BizCounting's services.");
    window.open(`https://wa.me/27123456789?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">BizCounting</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" className="gap-2" onClick={handleWhatsAppContact}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp Us
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Us
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Contact Our Team</DialogTitle>
                  <DialogDescription>
                    Interested in our professional accounting services? Send us a message and we'll get back to you soon.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
            <Button onClick={() => navigate('/auth')} size="lg">
              Sign In / Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Complete Business Management Platform
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          Streamline your accounting and HR operations with our comprehensive ERP solution.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/auth')} size="lg" className="gap-2">
            Get Started Free
          </Button>
        </div>
      </section>

      {/* 100% Free Message - Prominent Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-4">100% Free for Business Owners</h3>
          <p className="text-lg text-center text-muted-foreground mb-4">
            BizCounting is completely free to use. We generate revenue by offering optional professional 
            accounting services to help you manage your finances even better.
          </p>
          <div className="flex justify-center mb-8">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  Hire Us
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold text-center mb-10">Everything You Need to Run Your Business</h3>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Calculator className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Accounting System</CardTitle>
              <CardDescription>Complete financial management at your fingertips</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Professional invoice & quote generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Expense tracking & management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Inventory control & tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Financial reports & analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Journal entries & double-entry bookkeeping</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-primary" />
              <CardTitle>Payroll & HR System</CardTitle>
              <CardDescription>Simplify employee management and payroll</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Employee records & management</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>SARS-compliant payroll processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Leave management system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Automated payslip generation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>HR dashboard & analytics</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Additional Benefits */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Clock className="h-10 w-10 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Save Time</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Automate repetitive tasks and focus on growing your business
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-10 w-10 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Stay Compliant</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Built-in SARS compliance and financial best practices
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <TrendingUp className="h-10 w-10 mx-auto mb-2 text-primary" />
              <CardTitle className="text-lg">Grow Efficiently</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Scale your operations with powerful insights and reporting
            </CardContent>
          </Card>
        </div>
      </section>


      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-muted-foreground text-sm">
            <p>&copy; 2025 Nkani Business Solutions (Pty) Ltd. All rights reserved.</p>
            <div className="flex gap-6">
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
