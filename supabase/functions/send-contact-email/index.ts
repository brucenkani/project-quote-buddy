import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactEmailRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get SMTP settings
    const { data: smtpSettings, error: settingsError } = await supabase
      .from('smtp_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !smtpSettings) {
      console.error('SMTP settings error:', settingsError);
      throw new Error('SMTP settings not configured');
    }

    const { name, email, company, phone, message }: ContactEmailRequest = await req.json();

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create email content
    const emailBody = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Company: ${company || 'N/A'}
Phone: ${phone || 'N/A'}

Message:
${message}
    `.trim();

    // Connect to SMTP server
    const conn = await Deno.connectTls({
      hostname: smtpSettings.smtp_host,
      port: smtpSettings.smtp_port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to send SMTP commands
    const sendCommand = async (command: string) => {
      await conn.write(encoder.encode(command + '\r\n'));
      const buffer = new Uint8Array(1024);
      const bytesRead = await conn.read(buffer);
      return decoder.decode(buffer.subarray(0, bytesRead || 0));
    };

    // SMTP conversation
    await conn.read(new Uint8Array(1024)); // Read greeting

    await sendCommand(`EHLO ${smtpSettings.smtp_host}`);
    await sendCommand('AUTH LOGIN');
    await sendCommand(btoa(smtpSettings.smtp_user));
    await sendCommand(btoa(smtpSettings.smtp_password));
    await sendCommand(`MAIL FROM:<${smtpSettings.from_email}>`);
    await sendCommand(`RCPT TO:<bruce@nkani.co.za>`);
    await sendCommand('DATA');

    const emailContent = [
      `From: ${smtpSettings.from_name} <${smtpSettings.from_email}>`,
      'To: bruce@nkani.co.za',
      `Subject: New Contact Form Submission from ${name}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      emailBody,
      '.',
    ].join('\r\n');

    await conn.write(encoder.encode(emailContent + '\r\n'));
    await conn.read(new Uint8Array(1024));

    await sendCommand('QUIT');
    conn.close();

    console.log('Email sent successfully to bruce@nkani.co.za');

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-contact-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
