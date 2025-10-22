import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserPayload {
  email: string;
  password: string;
  role: 'admin' | 'accountant' | 'employee';
  companyId: string; // required - user must be invited to a company
  fullName?: string; // optional full name
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Client for the calling user (to verify permissions)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as CreateUserPayload;
    const { email, password, role, companyId, fullName } = payload;

    if (!email || !password || !role || !companyId) {
      return new Response(JSON.stringify({ error: 'email, password, role, and companyId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is owner of the specified company
    const { data: companyOwnership } = await supabaseClient
      .from('company_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .eq('role', 'owner')
      .maybeSingle();

    if (!companyOwnership) {
      console.error('Forbidden: caller is not owner of this company');
      return new Response(JSON.stringify({ error: 'Forbidden: Only company admins can invite users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const roleToAssign = role === 'admin' ? 'owner' : role; // map UI "admin" to DB "owner"

    // Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    // 1) Create the auth user with confirmed email
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || ''
      }
    });
    if (createErr) {
      console.error('Error creating user:', createErr);
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = created.user?.id;
    if (!newUserId) {
      return new Response(JSON.stringify({ error: 'Failed to create user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Ensure role is set to selected one (remove any default owner assigned by triggers)
    await supabaseAdmin.from('user_roles').delete().eq('user_id', newUserId);
    const { error: roleErr } = await supabaseAdmin.from('user_roles').insert({ user_id: newUserId, role: roleToAssign });
    if (roleErr) {
      console.error('Error assigning role:', roleErr);
      return new Response(JSON.stringify({ error: roleErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add the user as a member to the company
    const { error: memberErr } = await supabaseAdmin.from('company_members').insert({
      company_id: companyId,
      user_id: newUserId,
      role: roleToAssign,
    });
    if (memberErr) {
      console.error('Error adding company member:', memberErr);
      return new Response(JSON.stringify({ error: 'Failed to add user to company' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean up any auto-created company for the new user
    const { data: autoCompanies } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('created_by', newUserId);

    if (autoCompanies && autoCompanies.length > 0) {
      const ids = autoCompanies.map((c) => c.id);
      await supabaseAdmin.from('company_members').delete().in('company_id', ids);
      await supabaseAdmin.from('company_settings').delete().in('company_id', ids);
      await supabaseAdmin.from('companies').delete().in('id', ids);
    }

    return new Response(JSON.stringify({ success: true, userId: newUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in admin-create-user function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
