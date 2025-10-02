import { Contact } from '@/types/contacts';

const STORAGE_KEY = 'quotebuilder-contacts';

export const loadContacts = (): Contact[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load contacts:', error);
  }
  return [];
};

export const saveContacts = (contacts: Contact[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (error) {
    console.error('Failed to save contacts:', error);
  }
};

export const saveContact = (contact: Contact): void => {
  const contacts = loadContacts();
  const index = contacts.findIndex(c => c.id === contact.id);
  if (index >= 0) {
    contacts[index] = contact;
  } else {
    contacts.push(contact);
  }
  saveContacts(contacts);
};

export const deleteContact = (id: string): void => {
  const contacts = loadContacts().filter(c => c.id !== id);
  saveContacts(contacts);
};
