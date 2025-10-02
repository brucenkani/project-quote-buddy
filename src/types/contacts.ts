export type ContactType = 'client' | 'supplier';

export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
