-- Add optional group column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN contact_group TEXT;