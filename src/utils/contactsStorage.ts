import { Contact } from '@/types/contacts';
import { supabase } from '@/integrations/supabase/client';

export const loadContacts = async (): Promise<Contact[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      postalCode: row.postal_code || '',
      country: row.country || 'ZA',
      type: row.type as 'customer' | 'supplier' | 'both',
      taxNumber: row.tax_number || '',
      notes: row.notes || '',
    }));
  } catch (error) {
    console.error('Failed to load contacts:', error);
    return [];
  }
};

export const saveContacts = async (contacts: Contact[]): Promise<void> => {
  // Not used anymore - use saveContact instead
  console.warn('saveContacts is deprecated, use saveContact instead');
};

export const saveContact = async (contact: Contact): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('contacts')
      .upsert({
        id: contact.id,
        user_id: user.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        address: contact.address,
        city: contact.city,
        state: contact.state,
        postal_code: contact.postalCode,
        country: contact.country,
        type: contact.type,
        tax_number: contact.taxNumber,
        notes: contact.notes,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save contact:', error);
    throw error;
  }
};

export const deleteContact = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete contact:', error);
    throw error;
  }
};
