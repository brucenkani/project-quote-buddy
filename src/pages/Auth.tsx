import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Calculator, ArrowLeft } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [joinCommunity, setJoinCommunity] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [resetMode, setResetMode] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/landing');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Check for invitation token in URL
  useEffect(() => {
    const invitationToken = searchParams.get('invitation');
    if (invitationToken) {
      fetchInvitation(invitationToken);
    }
  }, [searchParams]);

  const fetchInvitation = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('get_invitation_by_token', {
        _token: token
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const invitation = data[0];
        setInvitationData(invitation);
        setEmail(invitation.email);
        toast({
          title: 'Invitation Found',
          description: `You've been invited to join as ${invitation.role}. Please create your account.`,
        });
      } else {
        toast({
          title: 'Invalid Invitation',
          description: 'This invitation link is invalid or has expired.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error fetching invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invitation details.',
        variant: 'destructive',
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/landing`,
        },
      });

      if (error) throw error;

      // If signing up via invitation, update the invitation status
      if (invitationData && authData.user) {
        const invitationToken = searchParams.get('invitation');
        
        // Update invitation status to accepted
        const { error: updateError } = await supabase
          .from('invitations')
          .update({ 
            status: 'accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('token', invitationToken);

        if (updateError) {
          console.error('Error updating invitation:', updateError);
        }

        // Assign the role from the invitation
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: invitationData.role
          });

        if (roleError) {
          console.error('Error assigning role:', roleError);
        }
      }

      // If user opted to join community, create a placeholder entry
      // They can complete their profile later
      if (joinCommunity && authData.user) {
        const { error: communityError } = await supabase
          .from('community_members')
          .insert({
            user_id: authData.user.id,
            business_name: fullName || 'My Business',
            business_category: 'Other',
            contact_email: email
          });

        if (communityError) {
          console.error('Error creating community profile:', communityError);
        }
      }

      toast({
        title: 'Check Your Email!',
        description: 'We sent you a confirmation link. Please check your email to verify your account.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/landing`,
      });

      if (error) throw error;

      toast({
        title: 'Check Your Email!',
        description: 'We sent you a password reset link.',
      });
      setResetMode(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              <h1 className="text-xl sm:text-2xl font-bold">BizCounting</h1>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex items-center justify-center p-4 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to BizCounting</CardTitle>
          <CardDescription>
            {invitationData 
              ? `You've been invited to join as ${invitationData.role}. Create your account below.`
              : 'Sign in to access your account'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={invitationData ? "signup" : "signin"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {resetMode ? (
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending reset link...' : 'Send Reset Link'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setResetMode(false)}
                  >
                    Back to Sign In
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full" 
                    onClick={() => setResetMode(true)}
                  >
                    Forgot Password?
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={!!invitationData}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="joinCommunity"
                      checked={joinCommunity}
                      onChange={(e) => setJoinCommunity(e.target.checked)}
                      className="rounded border-input"
                    />
                    <label htmlFor="joinCommunity" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Join the Business Community (optional)
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your business listed in our community directory and connect with other professionals
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
