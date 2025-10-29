import { ReactNode } from 'react';
import { CompanyProvider } from './CompanyContext';
import { SettingsProvider } from './SettingsContext';
import { ContactsProvider } from './ContactsContext';
import { InventoryProvider } from './InventoryContext';
import { WarehouseProvider } from './WarehouseContext';

export function DataProvider({ children }: { children: ReactNode }) {
  return (
    <CompanyProvider>
      <SettingsProvider>
        <ContactsProvider>
          <WarehouseProvider>
            <InventoryProvider>
              {children}
            </InventoryProvider>
          </WarehouseProvider>
        </ContactsProvider>
      </SettingsProvider>
    </CompanyProvider>
  );
}
