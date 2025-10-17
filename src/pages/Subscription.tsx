import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Subscription() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
      }

      setSubscription(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // PayFast integration would go here
      // For now, we'll show a message
      toast.info('PayFast integration coming soon. Please contact support to activate your subscription.');
      
      // TODO: Integrate with PayFast
      // 1. Create PayFast payment form
      // 2. Submit to PayFast
      // 3. Handle webhook callback
      // 4. Update subscription status
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process subscription');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const isActive = subscription?.status === 'active' && new Date(subscription.subscription_end) > new Date();
  const isTrial = subscription?.status === 'trial' && new Date(subscription.trial_end) > new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">Subscription Management</h1>
            <p className="text-lg text-muted-foreground">
              Manage your BizManager subscription
            </p>
          </div>

          {/* Current Status */}
          {subscription && (
            <Alert className="mb-8">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Current Status:</strong> {subscription.status.toUpperCase()}
                    {isTrial && (
                      <span className="ml-2">
                        (Expires: {new Date(subscription.trial_end).toLocaleDateString()})
                      </span>
                    )}
                    {isActive && (
                      <span className="ml-2">
                        (Next billing: {new Date(subscription.subscription_end).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Pricing Card */}
          <Card className="border-2 border-primary shadow-xl">
            <CardHeader className="text-center pb-8 pt-8">
              <div className="mb-4">
                <span className="text-5xl font-bold">R299</span>
                <span className="text-xl text-muted-foreground">/month</span>
              </div>
              <CardTitle className="text-2xl">Professional Plan</CardTitle>
              <CardDescription className="text-base mt-2">
                Complete business management suite with all features included
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Full Accounting System</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Payroll & HR Management</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>CRM & Sales Pipeline</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Business Analytics</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Customer Support System</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Business Calculators</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Multi-user Access</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Priority Support</span>
                </div>
              </div>

              {!isActive && (
                <Button 
                  size="lg" 
                  className="w-full text-lg py-6 gap-2" 
                  onClick={handleSubscribe}
                >
                  <CreditCard className="h-5 w-5" />
                  Subscribe Now via PayFast
                </Button>
              )}

              {isActive && (
                <div className="text-center">
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      Your subscription is active!
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-6">
                Secure payment powered by PayFast. Cancel anytime.
              </p>
            </CardContent>
          </Card>

          {/* Trial Info */}
          {isTrial && (
            <Alert className="mt-6">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Trial Period:</strong> You're currently on a free trial. 
                Subscribe before {new Date(subscription.trial_end).toLocaleDateString()} to continue 
                accessing all features without interruption.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
