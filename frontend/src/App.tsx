import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';

const PitchHarness = React.lazy(() => import('./apps/PitchHarness'));
const RequesterApp = React.lazy(() => import('./apps/RequesterApp'));
const DonorApp = React.lazy(() => import('./apps/DonorApp'));
const ConsoleApp = React.lazy(() => import('./apps/ConsoleApp'));
const Landing = React.lazy(() => import('./pages/Landing'));
const SmsSimulatorApp = React.lazy(() => import('./apps/SmsSimulatorApp'));
const UssdSimulatorApp = React.lazy(() => import('./apps/UssdSimulatorApp'));
const WhatsAppSimulatorApp = React.lazy(() => import('./apps/WhatsAppSimulatorApp'));
const BenchApp = React.lazy(() => import('./apps/BenchApp'));
const ArchitectureApp = React.lazy(() => import('./apps/ArchitectureApp'));
const PaymentReturn = React.lazy(() => import('./pages/PaymentReturn'));

type Route = 'landing' | 'pitch' | 'donor' | 'payment-return' | 'admin' | 'requester' | 'sms' | 'ussd' | 'whatsapp' | 'bench' | 'architecture';

function getRoute(): Route {
  // Vite base path is /mutual-circle/, so pathname comes in as
  // /mutual-circle/ or /mutual-circle/donor etc. Strip the base
  // (any /word prefix that isn't one of our routes) and match
  // on the last path segment.
  const segments = window.location.pathname.replace(/\/$/, '').split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  if (last === 'pitch') return 'pitch';
  if (last === 'donor') return 'donor';
  // Paystack returns donors to /donor/payment-return?reference=...
  if (last === 'payment-return') return 'payment-return';
  if (last === 'admin') return 'admin';
  if (last === 'sms') return 'sms';
  if (last === 'ussd') return 'ussd';
  if (last === 'whatsapp') return 'whatsapp';
  if (last === 'bench') return 'bench';
  if (last === 'architecture') return 'architecture';
  if (last === 'app' || last === 'requester') return 'requester';
  return 'landing';
}

function App() {
  const route = getRoute();
  return (
    <ErrorBoundary>
          <React.Suspense fallback={<div className="p-8 text-center text-sm text-muted">Loading...</div>}>
            {route === 'pitch' && <PitchHarness />}
            {route === 'landing' && <Landing />}
            {route === 'donor' && <DonorApp />}
            {route === 'payment-return' && <PaymentReturn />}
            {route === 'admin' && <ConsoleApp />}
            {route === 'requester' && <RequesterApp />}
            {route === 'sms' && <SmsSimulatorApp />}
            {route === 'ussd' && <UssdSimulatorApp />}
            {route === 'whatsapp' && <WhatsAppSimulatorApp />}
            {route === 'bench' && <BenchApp />}
            {route === 'architecture' && <ArchitectureApp />}          </React.Suspense>
    </ErrorBoundary>
  );
}

export default App;