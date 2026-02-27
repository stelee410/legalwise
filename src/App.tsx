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
        
        {/* 个人用户端路由 */}
        <Route
          path="/individual"
          element={
            <ProtectedRoute>
              <IndividualPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/individual/chat/:sessionId"
          element={
            <ProtectedRoute>
              <IndividualPortal />
            </ProtectedRoute>
          }
        />
        
        {/* 律师端路由 - 支持 tab 切换 */}
        <Route
          path="/lawyer"
          element={<Navigate to="/lawyer/assistant" replace />}
        />
        <Route
          path="/lawyer/:tab"
          element={
            <ProtectedRoute>
              <LawyerPortal />
            </ProtectedRoute>
          }
        />
        
        {/* 司法端路由 */}
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
