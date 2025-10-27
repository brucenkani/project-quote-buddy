import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateSuperAdmin() {
  const [email, setEmail] = useState("bruce@nkani.co.za");
  const [password, setPassword] = useState("Makanaka#2016");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('Calling create-super-admin function with:', { email });
      
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: { email, password }
      });

      console.log('Response:', { data, error });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      toast({
        title: "Success",
        description: "Super admin account created successfully",
      });
    } catch (err: any) {
      console.error('Error creating super admin:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create Super Admin</CardTitle>
          <CardDescription>Create a super admin account for the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription>Super admin account created successfully!</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Super Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
