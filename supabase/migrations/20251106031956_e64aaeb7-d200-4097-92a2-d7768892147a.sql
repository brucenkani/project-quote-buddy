-- Add foreign key constraint to payroll table with CASCADE delete
-- This ensures payroll records are automatically deleted when an employee is deleted
ALTER TABLE payroll 
ADD CONSTRAINT fk_payroll_employee 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);