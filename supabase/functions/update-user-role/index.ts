import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateUserRoleRequest {
  userId: string;
  role: string; // can be 'none' to remove role, or a valid app_role
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is owner (either via user_roles or company_members)
    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const { data: companyMemberships } = await supabaseClient
      .from('company_members')
      .select('role')
      .eq('user_id', user.id);

    const isOwner = userRoles?.role === 'owner' || 
                    (companyMemberships && companyMemberships.some(m => m.role === 'owner'));

    if (!isOwner) {
      console.error('Authorization error: User is not an owner');
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only owners can update user roles' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { userId, role }: UpdateUserRoleRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log(`Updating role for user: ${userId} to role: ${role}`);

    // Delete existing role
    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting existing role:', deleteError);
      throw deleteError;
    }

    // Insert new role only if not 'none'
    if (role !== 'none') {
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert([{ user_id: userId, role }]);

      if (insertError) {
        console.error('Error inserting new role:', insertError);
        throw insertError;
      }
    }

    console.log(`Successfully updated role for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: role === 'none' ? 'User role removed successfully' : 'User role updated successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in update-user-role function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
