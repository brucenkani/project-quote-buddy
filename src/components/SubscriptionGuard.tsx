import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  requireActive?: boolean;
}

export default function SubscriptionGuard({ children, requireActive = true }: SubscriptionGuardProps) {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    checkSubscription();
    
    const interval = setInterval(() => {
      if (subscription?.trial_end) {
        const now = new Date();
        const end = new Date(subscription.trial_end);
        const diff = end.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining('Expired');
          checkSubscription();
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [subscription]);

  const checkSubscription = async () => {
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

      if (error) {
        console.error('Error fetching subscription:', error);
        setLoading(false);
        return;
      }

      setSubscription(data);

      // Calculate initial time remaining
      if (data?.trial_end) {
        const now = new Date();
        const end = new Date(data.trial_end);
        const diff = end.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else {
          setTimeRemaining('Expired');
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in subscription check:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading subscription status...</p>
      </div>
    );
  }

  const isExpired = subscription?.status === 'expired' || 
                    (subscription?.status === 'trial' && new Date(subscription.trial_end) < new Date());

  if (requireActive && isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert className="max-w-2xl border-destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle className="text-xl mb-2">Subscription Expired</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>Your trial or subscription has expired. Please subscribe to continue using BizCounting.</p>
            <p className="text-sm text-muted-foreground">
              Your data will be kept for 7 days before automatic deletion.
            </p>
            <Button onClick={() => navigate('/subscription')} className="mt-4">
              Subscribe Now
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isTrial = subscription?.status === 'trial';

  return (
    <div>
      {isTrial && timeRemaining && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-primary/10">
          <Clock className="h-4 w-4" />
          <AlertTitle>Free Trial Active</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Time remaining: {timeRemaining}</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/subscription')}>
              Subscribe Now
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {children}
    </div>
  );
}
