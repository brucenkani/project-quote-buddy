// Temporary compatibility wrapper - DO NOT USE FOR NEW CODE
// Use ContactsContext instead
import { Contact } from '@/types/contacts';

export const loadContacts = (): Contact[] => {
  console.warn('loadContacts() is deprecated. Use useContacts() hook instead.');
  return [];
};

export const saveContact = (contact: Contact): void => {
  console.warn('saveContact() is deprecated. Use useContacts() hook instead.');
};
