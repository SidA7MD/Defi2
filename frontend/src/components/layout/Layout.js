import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

function RamadanLantern({ side, delay, size = 'md' }) {
  const sizes = {
    sm: { chain: 20, cap: 10, glass: 14, glassH: 20, base: 8 },
    md: { chain: 30, cap: 14, glass: 18, glassH: 28, base: 10 },
  };
  const s = sizes[size];
  const posStyle = side === 'left'
    ? { left: '3%' }
    : { right: '3%' };

  return (
    <div className="layout-lantern" style={{ ...posStyle, animationDelay: `${delay}s` }} aria-hidden="true">
      <div style={{ width: 2, height: s.chain, background: 'linear-gradient(to bottom, rgba(245,158,11,0.05), rgba(245,158,11,0.2))' }} />
      <div style={{ width: s.cap, height: 4, background: 'linear-gradient(135deg, #D97706, #B45309)', borderRadius: '2px 2px 0 0' }} />
      <div style={{
        width: s.glass, height: s.glassH,
        background: 'linear-gradient(180deg, rgba(251,191,36,0.25) 0%, rgba(245,158,11,0.35) 100%)',
        borderRadius: 4, border: '1px solid rgba(245,158,11,0.25)',
        boxShadow: '0 4px 12px rgba(245,158,11,0.1)',
      }} />
      <div style={{ width: s.base, height: 3, background: 'linear-gradient(135deg, #D97706, #B45309)', borderRadius: '0 0 3px 3px' }} />
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      <Navbar />
      {/* Subtle Ramadan lanterns on sides */}
      <div className="layout-lanterns" aria-hidden="true">
        <RamadanLantern side="left" delay={0} size="md" />
        <RamadanLantern side="right" delay={1} size="sm" />
      </div>
      {/* Floating crescent moons */}
      <div className="layout-moons" aria-hidden="true">
        <span className="layout-moon layout-moon-1">🌙</span>
        <span className="layout-moon layout-moon-2">🌙</span>
      </div>
      <main className="main-content" style={{ flex: 1 }}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
