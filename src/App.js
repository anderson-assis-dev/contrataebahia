import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useParams, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import HowItWorks from './components/HowItWorks';
import DualCTA from './components/DualCTA';
import BahiaSection from './components/BahiaSection';
import Footer from './components/Footer';
import SearchResults from './components/SearchResults';
import ProviderRegister from './components/ProviderRegister';
import TermsOfUse from './components/TermsOfUse';
import PrivacyPolicy from './components/PrivacyPolicy';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppLayout from './app/AppLayout';
import AppHome from './app/AppHome';
import RequireAuth from './app/RequireAuth';
import Login from './app/auth/Login';
import Register from './app/auth/Register';
import ActivateAccount from './app/auth/ActivateAccount';
import ProfileType from './app/account/ProfileType';
import { REF_STORAGE_KEY } from './utils/api';
import './styles/global.css';

function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => entry.target.classList.add('visible'), i * 100);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Hero />
      <Categories />
      <HowItWorks />
      <DualCTA />
      <BahiaSection />
    </>
  );
}

function SiteLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function AffiliateRedirect() {
  const { code } = useParams();
  useEffect(() => {
    if (code) localStorage.setItem(REF_STORAGE_KEY, code.toLowerCase());
  }, [code]);
  return <Navigate to="/" replace />;
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo(0, 0);
  }, [pathname, search, hash]);
  return null;
}

function HashScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ScrollToTop />
          <HashScroll />
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/buscar" element={<SearchResults />} />
              <Route path="/cadastro/prestador" element={<ProviderRegister />} />
              <Route path="/termos" element={<TermsOfUse />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
            </Route>

            <Route path="/entrar" element={<Login />} />
            <Route path="/criar-conta" element={<Register />} />
            <Route path="/ativar-conta" element={<ActivateAccount />} />
            <Route path="/r/:code" element={<AffiliateRedirect />} />

            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AppHome />} />
              <Route path="perfil/tipo" element={<ProfileType />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
