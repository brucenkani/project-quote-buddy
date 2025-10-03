import { useState } from 'react';
import Dashboard from './Dashboard';
import { Navigation } from '@/components/Navigation';

export default function AccountingDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Dashboard />
    </div>
  );
}
