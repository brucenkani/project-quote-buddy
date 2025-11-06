-- Make employee_number unique per company instead of globally
ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_employee_number_key;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_company_employee_number_key UNIQUE (company_id, employee_number);
