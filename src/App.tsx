import React, { useState } from 'react';
import { Role } from './types';
import Login from './components/Login';
import IndividualPortal from './components/IndividualPortal';
import LawyerPortal from './components/LawyerPortal';
import JudiciaryPortal from './components/JudiciaryPortal';

export default function App() {
  const [role, setRole] = useState<Role>(null);

  const handleLogout = () => setRole(null);

  if (!role) {
    return <Login onLogin={setRole} />;
  }

  switch (role) {
    case 'individual':
      return <IndividualPortal onLogout={handleLogout} />;
    case 'lawyer':
      return <LawyerPortal onLogout={handleLogout} />;
    case 'judiciary':
      return <JudiciaryPortal onBack={handleLogout} />;
    default:
      return <Login onLogin={setRole} />;
  }
}
