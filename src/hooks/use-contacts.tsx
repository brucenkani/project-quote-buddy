import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Contact } from '@/types/contacts';
import { loadContacts, saveContact as saveContactToDb, deleteContact as deleteContactFromDb } from '@/utils/contactsStorage';

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

  const refreshContacts = async () => {
    setLoading(true);
    const data = await loadContacts();
    setContacts(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshContacts();
  }, []);

  const saveContact = async (contact: Contact) => {
    await saveContactToDb(contact);
    await refreshContacts();
  };

  const deleteContact = async (id: string) => {
    await deleteContactFromDb(id);
    await refreshContacts();
  };

  return (
    <ContactsContext.Provider value={{ contacts, loading, saveContact, deleteContact, refreshContacts }}>
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
