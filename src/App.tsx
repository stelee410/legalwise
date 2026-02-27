import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import IndividualPortal from './components/IndividualPortal';
import LawyerPortal from './components/LawyerPortal';
import JudiciaryPortal from './components/JudiciaryPortal';
import { getAuth } from './lib/authStorage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/individual"
          element={
            <ProtectedRoute>
              <IndividualPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lawyer"
          element={
            <ProtectedRoute>
              <LawyerPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/judiciary"
          element={
            <ProtectedRoute>
              <JudiciaryPortal />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
