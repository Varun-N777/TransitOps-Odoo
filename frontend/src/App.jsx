import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import MaintenanceFuel from './pages/MaintenanceFuel';
import Reports from './pages/Reports';

const ProtectedLayout = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading TransitOps...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          } />

          <Route path="/vehicles" element={
            <ProtectedLayout>
              <Vehicles />
            </ProtectedLayout>
          } />

          <Route path="/drivers" element={
            <ProtectedLayout>
              <Drivers />
            </ProtectedLayout>
          } />

          <Route path="/trips" element={
            <ProtectedLayout>
              <Trips />
            </ProtectedLayout>
          } />

          <Route path="/maintenance" element={
            <ProtectedLayout>
              <MaintenanceFuel />
            </ProtectedLayout>
          } />

          <Route path="/reports" element={
            <ProtectedLayout>
              <Reports />
            </ProtectedLayout>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
