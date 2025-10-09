import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Contact, ContactType } from '@/types/contacts';
import { supabase } from '@/integrations/supabase/client';

interface ContactsContextType {
  contacts: Contact[];
  loading: boolean;
  saveContact: (contact: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  refreshContacts: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined);

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setContacts([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;

      const mappedContacts = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone || '',
        address: row.address || '',
        type: (row.type === 'both' ? 'client' : row.type === 'customer' ? 'client' : row.type) as ContactType,
        taxId: row.tax_number || '',
        notes: row.notes || '',
        createdAt: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
      }) as Contact);

      setContacts(mappedContacts);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const saveContact = async (contact: Contact) => {
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
          city: '',
          state: '',
          postal_code: '',
          country: 'ZA',
          type: contact.type === 'client' ? 'customer' : contact.type,
          tax_number: contact.taxId,
          notes: contact.notes,
        });

      if (error) throw error;
      await loadContacts();
    } catch (error) {
      console.error('Failed to save contact:', error);
      throw error;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  };

  return (
    <ContactsContext.Provider value={{ contacts, loading, saveContact, deleteContact, refreshContacts: loadContacts }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (!context) {
    throw new Error('useContacts must be used within ContactsProvider');
  }
  return context;
}
