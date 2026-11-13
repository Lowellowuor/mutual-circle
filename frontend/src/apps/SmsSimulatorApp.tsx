import React from 'react';
import { AppProvider } from '../context/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { SmsSimulator } from '../components/Requester/SmsSimulator';
import { Smartphone } from 'lucide-react';

const NAV = [{ id: 'sms', label: 'SMS', Icon: Smartphone }];

export default function SmsSimulatorApp() {
  return (
    <AppProvider>
      <AppShell
        currentView="sms"
        onViewChange={() => {}}
        navItems={NAV}
        showDrawer={false}
        showBottomNav={false}
      >
        <SmsSimulator />
      </AppShell>
    </AppProvider>
  );
}
