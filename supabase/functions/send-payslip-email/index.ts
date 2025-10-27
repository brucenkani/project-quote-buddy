import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayslipEmailRequest {
  employeeEmail: string;
  employeeName: string;
  periodStart: string;
  periodEnd: string;
  netSalary: number;
  pdfBase64: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's company
    const { data: memberData, error: memberError } = await supabaseClient
      .from('company_members')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      throw new Error('No company association found');
    }

    // Get company's SMTP settings
    const { data: smtpSettings, error: settingsError } = await supabaseClient
      .from('payroll_settings')
      .select('smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_email, smtp_from_name')
      .eq('company_id', memberData.company_id)
      .single();

    if (settingsError || !smtpSettings) {
      throw new Error('SMTP settings not configured. Please configure in Payroll & HR Settings.');
    }

    if (!smtpSettings.smtp_host || !smtpSettings.smtp_user || !smtpSettings.smtp_password) {
      throw new Error('Incomplete SMTP configuration');
    }

    const {
      employeeEmail,
      employeeName,
      periodStart,
      periodEnd,
      netSalary,
      pdfBase64,
    }: PayslipEmailRequest = await req.json();

    console.log('Sending payslip email to:', employeeEmail);

    // Create email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .payslip-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .amount { font-size: 28px; font-weight: bold; color: #667eea; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Payslip is Ready</h1>
    </div>
    <div class="content">
      <h2>Hello ${employeeName},</h2>
      <p>Your payslip for the period <strong>${periodStart}</strong> to <strong>${periodEnd}</strong> is now available.</p>
      
      <div class="payslip-info">
        <h3>Payment Summary</h3>
        <p>Net Salary:</p>
        <div class="amount">R ${netSalary.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
      </div>

      <p>Your detailed payslip is attached to this email as a PDF document. Please download and keep it for your records.</p>

      <p><strong>Important:</strong> If you have any questions about your payslip, please contact the HR department.</p>

      <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} ${smtpSettings.smtp_from_name || 'Payroll System'}. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Send email using SMTP
    const boundary = "----boundary";
    const emailContent = [
      `From: ${smtpSettings.smtp_from_name || 'Payroll System'} <${smtpSettings.smtp_from_email}>`,
      `To: ${employeeEmail}`,
      `Subject: Your Payslip - ${periodStart} to ${periodEnd}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      emailHtml,
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="payslip.pdf"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="payslip.pdf"`,
      ``,
      pdfBase64,
      ``,
      `--${boundary}--`,
    ].join('\r\n');

    // Connect to SMTP server and send email
    const conn = await Deno.connect({
      hostname: smtpSettings.smtp_host,
      port: smtpSettings.smtp_port || 587,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    async function readLine(conn: Deno.Conn): Promise<string> {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      return decoder.decode(buffer.subarray(0, n || 0));
    }

    async function sendCommand(conn: Deno.Conn, command: string) {
      await conn.write(encoder.encode(command + '\r\n'));
      return await readLine(conn);
    }

    // SMTP handshake
    await readLine(conn); // Welcome message
    await sendCommand(conn, `EHLO ${smtpSettings.smtp_host}`);
    await sendCommand(conn, 'STARTTLS');
    
    // Upgrade to TLS
    const tlsConn = await Deno.startTls(conn, { hostname: smtpSettings.smtp_host });
    
    await sendCommand(tlsConn, `EHLO ${smtpSettings.smtp_host}`);
    await sendCommand(tlsConn, 'AUTH LOGIN');
    await sendCommand(tlsConn, btoa(smtpSettings.smtp_user));
    await sendCommand(tlsConn, btoa(smtpSettings.smtp_password));
    await sendCommand(tlsConn, `MAIL FROM:<${smtpSettings.smtp_from_email}>`);
    await sendCommand(tlsConn, `RCPT TO:<${employeeEmail}>`);
    await sendCommand(tlsConn, 'DATA');
    await tlsConn.write(encoder.encode(emailContent + '\r\n.\r\n'));
    await readLine(tlsConn);
    await sendCommand(tlsConn, 'QUIT');
    
    tlsConn.close();

    console.log('Email sent successfully to:', employeeEmail);

    return new Response(
      JSON.stringify({ success: true, message: 'Payslip email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error sending payslip email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
