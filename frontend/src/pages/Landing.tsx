import React from 'react';
import { LanguageProvider } from '../i18n';
import {
  TopBar,
  Hero,
  ThreeDoors,
  HowItWorks,
  Private,
  ThePool,
  Partners,
  Faq,
  Footer,
  MobileDock,
} from '../components/Landing';

const Landing: React.FC = () => (
  <LanguageProvider>
    <TopBar />
    <main>
      <Hero />
      <ThreeDoors />
      <HowItWorks />
      <Private />
      <ThePool />
      <Partners />
      <Faq />
    </main>
    <Footer />
    <MobileDock />
  </LanguageProvider>
);

export default Landing;
