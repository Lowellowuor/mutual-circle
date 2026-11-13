import React from 'react';
import { AppProvider } from '../context/AppContext';
import { AppShell } from '../components/layout/AppShell';
import { WhatsAppSimulator } from '../components/Requester/WhatsAppSimulator';
import { MessageSquare } from 'lucide-react';

const NAV = [{ id: 'whatsapp', label: 'WhatsApp', Icon: MessageSquare }];

export default function WhatsAppSimulatorApp() {
  return (
    <AppProvider>
      <AppShell
        currentView="whatsapp"
        onViewChange={() => {}}
        navItems={NAV}
        showDrawer={false}
        showBottomNav={false}
      >
        <WhatsAppSimulator />
      </AppShell>
    </AppProvider>
  );
}
