import { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { ContactsProvider } from './ContactsContext';
import { InventoryProvider } from './InventoryContext';

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ContactsProvider>
        <InventoryProvider>
          {children}
        </InventoryProvider>
      </ContactsProvider>
    </SettingsProvider>
  );
}
