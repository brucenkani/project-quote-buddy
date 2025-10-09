import { ReactNode } from 'react';
import { CompanyProvider } from './CompanyContext';
import { SettingsProvider } from './SettingsContext';
import { ContactsProvider } from './ContactsContext';
import { InventoryProvider } from './InventoryContext';

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <CompanyProvider>
      <SettingsProvider>
        <ContactsProvider>
          <InventoryProvider>
            {children}
          </InventoryProvider>
        </ContactsProvider>
      </SettingsProvider>
    </CompanyProvider>
  );
}
