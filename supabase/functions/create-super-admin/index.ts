import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    // Get email and password from request body
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Check if super admin already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const superAdminExists = existingUser?.users?.some(u => u.email === email);

    if (superAdminExists) {
      return new Response(
        JSON.stringify({ 
          message: 'Super admin already exists',
          email: email,
          note: 'Use existing credentials'
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Create the super admin auth user
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'System Administrator'
      }
    });

    if (createErr) {
      console.error('Error creating super admin:', createErr);
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = created.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assign super_admin role
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
    const { error: roleErr } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'super_admin' });

    if (roleErr) {
      console.error('Error assigning super admin role:', roleErr);
      return new Response(JSON.stringify({ error: roleErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create profile
    const { error: profileErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        full_name: 'System Administrator'
      });

    if (profileErr) {
      console.error('Error creating profile:', profileErr);
    }

    // Clean up any auto-created company
    const { data: autoCompanies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('created_by', userId);

    if (autoCompanies && autoCompanies.length > 0) {
      const ids = autoCompanies.map((c) => c.id);
      await supabaseAdmin.from('company_members').delete().in('company_id', ids);
      await supabaseAdmin.from('company_settings').delete().in('company_id', ids);
      await supabaseAdmin.from('companies').delete().in('id', ids);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Super admin created successfully',
        credentials: {
          email: email,
          password: password,
          note: 'Save these credentials securely. The super admin has unrestricted access to the entire platform.'
        }
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in create-super-admin function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
