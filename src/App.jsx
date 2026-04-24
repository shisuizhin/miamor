import React, { useState } from 'react';

import Navbar from './components/navbar';
import HowItBegun from './components/howitbegun';
import Memories from './components/memories';
import LoveNote from './components/lovenotes';
import ThingsWeLove from './components/thingswelove';
import BucketList from './components/bucketlist';
import AdminPanel from './components/adminpanel';

function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div className="App">
      <Navbar />
      <HowItBegun />
      <Memories />
      <LoveNote />
      <ThingsWeLove />
      <BucketList />

      {/* Admin button fixed bottom-right */}
      <button
        onClick={() => setShowAdmin(true)}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          background: '#c0002a',
          border: 'none',
          borderRadius: '50px',
          padding: '10px 22px',
          fontSize: '12px',
          fontFamily: 'Lato, sans-serif',
          fontWeight: '700',
          letterSpacing: '2px',
          color: '#ffffff',
          cursor: 'pointer',
          zIndex: 999,
          boxShadow: '0 4px 16px rgba(192,0,42,0.3)',
        }}
      >
        ♥ ADMIN
      </button>

      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} />
      )}
    </div>
  );
}

export default App;