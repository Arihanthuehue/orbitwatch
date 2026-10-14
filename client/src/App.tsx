import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/layout/Navbar.js';
import { Footer } from './components/layout/Footer.js';
import { LandingPage } from './pages/LandingPage.js';
import { OrbitExplorerPage } from './pages/OrbitExplorerPage.js';
import { ConjunctionMonitorPage } from './pages/ConjunctionMonitorPage.js';
import { CatalogPage } from './pages/CatalogPage.js';
import { GroundStationsPage } from './pages/GroundStationsPage.js';
import { AsteroidsWeatherPage } from './pages/AsteroidsWeatherPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { DbmsLabPage } from './pages/DbmsLabPage.js';
import { LearnPage } from './pages/LearnPage.js';
import { VivaPrepPage } from './pages/VivaPrepPage.js';
import { Da3ChecklistPage } from './pages/Da3ChecklistPage.js';
import { TestingPage } from './pages/TestingPage.js';
import { ExportsPage } from './pages/ExportsPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { OrbitObject, TrackingStation, ConjunctionEvent } from './types/index.js';
import { ArrowUp, X } from 'lucide-react';
import api from './services/api.js';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Shared 3D Scene Data
  const [globeObjects, setGlobeObjects] = useState<OrbitObject[]>([]);
  const [stations, setStations] = useState<TrackingStation[]>([]);
  const [conjunctions, setConjunctions] = useState<ConjunctionEvent[]>([]);

  const loadGlobalData = async () => {
    try {
      const [objRes, stRes, cRes] = await Promise.all([
        api.get('/objects/all'),
        api.get('/stations'),
        api.get('/conjunctions?limit=50')
      ]);

      if (objRes.data.success) {
        const combined: OrbitObject[] = [
          ...(objRes.data.satellites || []),
          ...(objRes.data.debris || [])
        ];
        setGlobeObjects(combined);
      }

      if (stRes.data.success) {
        setStations(stRes.data.stations || []);
      }

      if (cRes.data.success) {
        setConjunctions(cRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load global orbital assets:', err);
    }
  };

  useEffect(() => {
    loadGlobalData();
    const interval = setInterval(() => {
      loadGlobalData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll spy to detect current active section on screen
  useEffect(() => {
    const sectionIds = [
      'hero', 'explore', 'monitor', 'catalog', 'stations',
      'weather', 'analytics', 'dbms-lab', 'learn', 'viva-prep',
      'checklist', 'testing', 'exports'
    ];

    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      setShowBackToTop(window.scrollY > 600);

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offsetTop = el.offsetTop - 65;
      window.scrollTo({
        top: Math.max(0, offsetTop),
        behavior: 'smooth'
      });
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 flex flex-col justify-between selection:bg-orbit-red/30 selection:text-white">
      {/* Sticky Top Navigation */}
      <Navbar
        activeSection={activeSection}
        onNavigateSection={scrollToSection}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onRefreshAllData={loadGlobalData}
      />

      {/* Main Single Flowing Scroll-Based Content */}
      <main className="flex-1 w-full space-y-24 pb-16">
        {/* 1. Hero / Landing Section */}
        <section id="hero" className="w-full">
          <LandingPage onNavigate={scrollToSection} globeObjects={globeObjects} />
        </section>

        {/* 2. Live Orbit Explorer (Flagship 3D Globe) */}
        <motion.section
          id="explore"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4"
        >
          <div className="mb-4">
            <span className="text-xs font-bold text-orbit-yellow uppercase tracking-wider block">Live Mission Control</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">3D Live Orbit Explorer</h2>
          </div>
          <div className="w-full h-[88vh] min-h-[720px] rounded-3xl overflow-hidden border border-[#262626] shadow-2xl relative">
            <OrbitExplorerPage objects={globeObjects} stations={stations} conjunctions={conjunctions} />
          </div>
        </motion.section>

        {/* 3. Conjunction & Collision Monitor */}
        <motion.section
          id="monitor"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <ConjunctionMonitorPage />
        </motion.section>

        {/* 4. Space Assets Catalog (Satellites & Debris CRUD) */}
        <motion.section
          id="catalog"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <CatalogPage />
        </motion.section>

        {/* 5. Ground Tracking Radar Stations */}
        <motion.section
          id="stations"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <GroundStationsPage />
        </motion.section>

        {/* 6. Space Weather & Asteroids */}
        <motion.section
          id="weather"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <AsteroidsWeatherPage />
        </motion.section>

        {/* 7. SSA Analytics Dashboard */}
        <motion.section
          id="analytics"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <DashboardPage />
        </motion.section>

        {/* 8. DBMS Lab (SQL Console, Routines, Transactions, Indexing) */}
        <motion.section
          id="dbms-lab"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <DbmsLabPage />
        </motion.section>

        {/* 9. Course Documentation & Theory (Learn) */}
        <motion.section
          id="learn"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <LearnPage />
        </motion.section>

        {/* 10. Viva Defense & Question Bank */}
        <motion.section
          id="viva-prep"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <VivaPrepPage />
        </motion.section>

        {/* 11. DA3 Evaluation Checklist */}
        <motion.section
          id="checklist"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <Da3ChecklistPage onNavigate={scrollToSection} />
        </motion.section>

        {/* 12. Automated Verification & Testing Suite */}
        <motion.section
          id="testing"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <TestingPage />
        </motion.section>

        {/* 13. Exports & Offline Backups */}
        <motion.section
          id="exports"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={sectionVariants}
          className="w-full scroll-mt-20"
        >
          <ExportsPage />
        </motion.section>
      </main>

      {/* Floating Back-To-Top Button */}
      {showBackToTop && (
        <button
          onClick={() => scrollToSection('hero')}
          className="fixed bottom-6 left-6 z-40 p-3 rounded-xl bg-[#161616] border border-[#2e2e2e] text-neutral-300 hover:text-white hover:border-orbit-red transition-all shadow-2xl"
          title="Scroll Back to Top"
        >
          <ArrowUp className="w-5 h-5 text-orbit-yellow" />
        </button>
      )}

      {/* Login Modal Overlay */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <LoginPage onSuccess={() => setShowLoginModal(false)} />
            </div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};
