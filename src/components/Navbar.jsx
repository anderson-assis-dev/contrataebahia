import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Menu, X } from 'lucide-react';
import './Navbar.css';
import { BRAND_NAME, LOGO_SRC } from '../utils/brand';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { href: '/#como-funciona', label: 'Como funciona' },
  { href: '/#categorias', label: 'Categorias' },
  { href: '/#prestadores', label: 'Para prestadores' },
];

function Navbar() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" aria-label={`${BRAND_NAME} — página inicial`}>
          <img className="nav-logo-img" src={LOGO_SRC} alt={BRAND_NAME} />
        </Link>

        <ul className="nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {isAuthenticated ? (
            <Link to="/app" className="nav-cta">
              <LayoutDashboard size={17} />
              Minha conta
            </Link>
          ) : (
            <>
              <Link to="/entrar" className="nav-link-plain">Entrar</Link>
              <Link to="/criar-conta" className="nav-cta">Criar conta</Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="nav-burger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="nav-drawer">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>
              </li>
            ))}
          </ul>
          <div className="nav-drawer-actions">
            {isAuthenticated ? (
              <Link to="/app" className="btn-primary">Ir para minha conta</Link>
            ) : (
              <>
                <Link to="/entrar" className="btn-outline">Entrar</Link>
                <Link to="/criar-conta" className="btn-primary">Criar conta</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
