import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useContacts } from '@/contexts/ContactsContext';

interface GroupSelectorProps {
  value: string;
  onChange: (value: string) => void;
  type: 'client' | 'supplier';
}

export function GroupSelector({ value, onChange, type }: GroupSelectorProps) {
  const { contacts } = useContacts();
  const [groups, setGroups] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState('');

  useEffect(() => {
    // Extract unique groups from contacts of the specified type
    const uniqueGroups = Array.from(
      new Set(
        contacts
          .filter(c => c.type === type && c.contactGroup)
          .map(c => c.contactGroup!)
      )
    ).sort();
    setGroups(uniqueGroups);
  }, [contacts, type]);

  const handleCreateGroup = () => {
    if (!newGroup.trim()) return;
    
    if (!groups.includes(newGroup.trim())) {
      const updatedGroups = [...groups, newGroup.trim()].sort();
      setGroups(updatedGroups);
    }
    
    onChange(newGroup.trim());
    setNewGroup('');
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${type} group`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Enter a name for the new {type} group
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="e.g., Wholesale, Retail"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateGroup();
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNewGroup('');
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateGroup}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
