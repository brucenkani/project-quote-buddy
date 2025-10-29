import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { Contact, ContactType } from '@/types/contacts';
import { useContacts } from '@/contexts/ContactsContext';

interface ContactSelectorProps {
  type: ContactType;
  value: string;
  onSelect: (contact: Contact) => void;
  placeholder?: string;
}

export function ContactSelector({ type, value, onSelect, placeholder }: ContactSelectorProps) {
  const { contacts: allContacts, saveContact, refreshContacts } = useContacts();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    notes: '',
  });

  useEffect(() => {
    setContacts(allContacts.filter(c => c.type === type));
  }, [allContacts, type]);

  // Find the contact ID from the name (value could be either ID or name)
  const selectedContactId = contacts.find(c => c.id === value || c.name === value)?.id || '';

  const handleCreateContact = async () => {
    if (!formData.name) return;

    const newContact: Contact = {
      id: crypto.randomUUID(),
      type,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      taxId: formData.taxId,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveContact(newContact);
    await refreshContacts();
    onSelect(newContact);
    setIsDialogOpen(false);
    setFormData({ name: '', email: '', phone: '', address: '', taxId: '', notes: '' });
  };

  return (
    <div className="flex gap-2">
      <Select
        value={selectedContactId}
        onValueChange={(contactId) => {
          const contact = contacts.find(c => c.id === contactId);
          if (contact) onSelect(contact);
        }}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder || `Select ${type}...`} />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          {contacts.map((contact) => (
            <SelectItem key={contact.id} value={contact.id}>
              {contact.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New {type === 'client' ? 'Client' : 'Supplier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4 overflow-y-auto flex-1 px-1">
            <div className="space-y-2">
              <Label htmlFor="contactName">Name *</Label>
              <Input
                id="contactName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactAddress">Address</Label>
              <Input
                id="contactAddress"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactTaxId">Tax ID</Label>
              <Input
                id="contactTaxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNotes">Notes</Label>
              <Textarea
                id="contactNotes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateContact}>Add {type === 'client' ? 'Client' : 'Supplier'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
