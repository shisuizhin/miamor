import React, { useState, useEffect } from 'react';
import './navbar.css';

const Navbar = () => {
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'how-it-begun', label: 'How It Begun', icon: '✦' },
    { id: 'memories', label: 'Memories', icon: '✦' },
    { id: 'things-we-love', label: 'Things We Love', icon: '✦' },
    { id: 'love-notes', label: 'Love Notes', icon: '✦' },
    { id: 'bucket-list', label: 'Bucket List', icon: '✦' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Logo / Brand */}
        <div className="navbar-brand">
          <span className="brand-heart">♥</span>
          <span className="brand-name">miamor</span>
        </div>

        {/* Desktop Links */}
        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                className={`nav-link ${active === link.id ? 'active' : ''}`}
                onClick={() => setActive(link.id)}
              >
                {link.label}
                <span className="link-underline" />
              </a>
            </li>
          ))}
        </ul>

        {/* Hamburger */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {navLinks.map((link, i) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className={`mobile-link ${active === link.id ? 'active' : ''}`}
            style={{ animationDelay: `${i * 0.07}s` }}
            onClick={() => {
              setActive(link.id);
              setMenuOpen(false);
            }}
          >
            <span className="mobile-icon">{link.icon}</span>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;