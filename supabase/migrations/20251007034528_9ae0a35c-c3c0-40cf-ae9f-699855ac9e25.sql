-- Add leave allocation columns to employees table
ALTER TABLE public.employees
ADD COLUMN annual_leave_days numeric DEFAULT 21,
ADD COLUMN sick_leave_days numeric DEFAULT 30,
ADD COLUMN family_responsibility_leave_days numeric DEFAULT 3,
ADD COLUMN maternity_leave_days numeric DEFAULT 0,
ADD COLUMN study_leave_days numeric DEFAULT 0;