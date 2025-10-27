-- Add company_id to payroll_settings if not exists and make it company-specific
ALTER TABLE payroll_settings 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Add SMTP configuration fields for company-specific email settings
ALTER TABLE payroll_settings
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_password TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_email TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_name TEXT DEFAULT 'Payroll System';

-- Create index for company lookups
CREATE INDEX IF NOT EXISTS idx_payroll_settings_company_id ON payroll_settings(company_id);

-- Update RLS policies for payroll_settings to be company-aware
DROP POLICY IF EXISTS "Users can view payroll settings" ON payroll_settings;
DROP POLICY IF EXISTS "Users can insert payroll settings" ON payroll_settings;
DROP POLICY IF EXISTS "Users can update payroll settings" ON payroll_settings;

CREATE POLICY "Users can view their company payroll settings"
ON payroll_settings FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company owners can insert payroll settings"
ON payroll_settings FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM company_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

CREATE POLICY "Company owners can update payroll settings"
ON payroll_settings FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM company_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);