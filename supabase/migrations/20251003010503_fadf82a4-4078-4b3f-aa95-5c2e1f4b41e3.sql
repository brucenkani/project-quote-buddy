-- Create role enum for different user types
CREATE TYPE public.app_role AS ENUM ('owner', 'accountant', 'employee');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Owners can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Owners can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.is_owner(auth.uid()));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Owners can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_owner(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create employees table
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  id_number TEXT UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  position TEXT NOT NULL,
  department TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  basic_salary DECIMAL(15,2) NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  account_type TEXT,
  tax_number TEXT,
  uif_number TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and accountants can view all employees"
  ON public.employees FOR SELECT
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Employees can view their own record"
  ON public.employees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners and accountants can manage employees"
  ON public.employees FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accountant'));

-- Create SARS tax brackets table
CREATE TABLE public.sars_tax_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  age_group TEXT NOT NULL CHECK (age_group IN ('under_65', '65_to_75', 'over_75')),
  bracket_min DECIMAL(15,2) NOT NULL,
  bracket_max DECIMAL(15,2),
  rate DECIMAL(5,4) NOT NULL,
  threshold DECIMAL(15,2) NOT NULL,
  rebate DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (year, age_group, bracket_min)
);

ALTER TABLE public.sars_tax_brackets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view tax brackets"
  ON public.sars_tax_brackets FOR SELECT
  USING (true);

CREATE POLICY "Only owners can manage tax brackets"
  ON public.sars_tax_brackets FOR ALL
  USING (public.is_owner(auth.uid()));

-- Create payroll table
CREATE TABLE public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  basic_salary DECIMAL(15,2) NOT NULL,
  allowances DECIMAL(15,2) DEFAULT 0,
  overtime DECIMAL(15,2) DEFAULT 0,
  bonuses DECIMAL(15,2) DEFAULT 0,
  gross_salary DECIMAL(15,2) NOT NULL,
  paye DECIMAL(15,2) DEFAULT 0,
  uif DECIMAL(15,2) DEFAULT 0,
  other_deductions DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) NOT NULL,
  net_salary DECIMAL(15,2) NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and accountants can view all payroll"
  ON public.payroll FOR SELECT
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Employees can view their own payroll"
  ON public.payroll FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = payroll.employee_id
    AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Owners and accountants can manage payroll"
  ON public.payroll FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accountant'));

-- Create leave types table
CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  days_per_year DECIMAL(5,2) NOT NULL,
  carry_over BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view leave types"
  ON public.leave_types FOR SELECT
  USING (true);

CREATE POLICY "Only owners can manage leave types"
  ON public.leave_types FOR ALL
  USING (public.is_owner(auth.uid()));

-- Insert default leave types for South Africa
INSERT INTO public.leave_types (name, days_per_year, carry_over, description) VALUES
('Annual Leave', 21, true, 'Annual leave as per BCEA - 21 consecutive days or 15 working days per year'),
('Sick Leave', 30, false, 'Sick leave - 30 days per 3-year cycle'),
('Family Responsibility Leave', 3, false, 'Family responsibility leave - 3 days per year'),
('Maternity Leave', 120, false, 'Maternity leave - 4 consecutive months'),
('Paternity Leave', 10, false, 'Paternity leave - 10 consecutive days');

-- Create leave balance table
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type_id UUID REFERENCES public.leave_types(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  used_days DECIMAL(5,2) DEFAULT 0,
  available_days DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, leave_type_id, year)
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and accountants can view all leave balances"
  ON public.leave_balances FOR SELECT
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Employees can view their own leave balance"
  ON public.leave_balances FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = leave_balances.employee_id
    AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Owners and accountants can manage leave balances"
  ON public.leave_balances FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accountant'));

-- Create leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  leave_type_id UUID REFERENCES public.leave_types(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested DECIMAL(5,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and accountants can view all leave requests"
  ON public.leave_requests FOR SELECT
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Employees can view their own leave requests"
  ON public.leave_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = leave_requests.employee_id
    AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Employees can create their own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employees
    WHERE employees.id = leave_requests.employee_id
    AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Owners and accountants can manage leave requests"
  ON public.leave_requests FOR ALL
  USING (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'accountant'));

-- Create update trigger for employees
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();