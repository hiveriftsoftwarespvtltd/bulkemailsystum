import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SMTPAccounts from './pages/SMTPAccounts';
import Campaigns from './pages/Campaigns';
import EmailAccounts from './pages/EmailAccounts';
import CreateCampaign from './pages/CreateCampaign';
import CampaignConfig from './pages/CampaignConfig';
import CampaignReview from './pages/CampaignReview';
import AuditLog from './pages/AuditLog';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import config from './config';
import CampaignInbox from './pages/CampaignInbox';
import Navbar from './components/Navbar';

// --- GLOBAL FETCH INTERCEPTOR FOR SESSION TIMEOUTS ---
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  const response = await originalFetch.apply(this, args);
  // Only intercept API calls matching our base URL
  if ((response.status === 401 || response.status === 403) && args[0] && typeof args[0] === 'string' && args[0].includes(config.API_BASE_URL)) {
    console.warn("Global Interceptor: Session expired. Logging out.");
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return response;
};

// --- MAIN LAYOUT COMPONENT ---
const MainLayout = ({ children, onLogout }) => {
  let user = {};
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
  }
  const location = useLocation();

  // Hide sidebar on campaign creation/config/review routes
  const isCampaignFlow = location.pathname.startsWith('/campaigns/config') ||
    location.pathname.startsWith('/campaigns/review');

  return (
    <div className="flex h-screen bg-surface text-text-main font-sans overflow-hidden">
      {!isCampaignFlow && <Sidebar />}
      <main className={`${!isCampaignFlow ? 'ml-64' : 'ml-0'} flex-1 flex flex-col overflow-hidden transition-all duration-300`}>
        {/* --- NAVBAR --- */}
        {!isCampaignFlow && (
          <Navbar user={user} onLogout={onLogout} />
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto page-animate">
          {children}
        </div>
      </main>
    </div>
  );
};

const getSafeUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== "undefined") {
      return JSON.parse(storedUser);
    }
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
  }
  return null;
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const [user, setUser] = useState(getSafeUser());
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      // Give a tiny delay for token stability on refresh
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const response = await fetch(`${config.API_BASE_URL}/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const result = await response.json();
          const userData = result.data; // Access the nested data object
          setIsAuthenticated(true);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (response.status === 401 || response.status === 403) {
          console.warn("Session expired. Logging out...");
          // Only redirect if we ARE on a protected route
          handleLogout();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error("Profile sync error (Offline or slow server):", error);
      }
    };

    checkAuth();
  }, []);

  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={() => setIsAuthenticated(true)} />
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={isAuthenticated ? <MainLayout onLogout={handleLogout}><Dashboard /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/smtp"
          element={isAuthenticated ? <MainLayout onLogout={handleLogout}><SMTPAccounts /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/email-accounts"
          element={isAuthenticated ? <MainLayout onLogout={handleLogout}><EmailAccounts /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/campaigns"
          element={isAuthenticated ? <MainLayout onLogout={handleLogout}><Campaigns /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/campaigns/config"
          element={isAuthenticated ? <MainLayout onLogout={handleLogout}><CampaignConfig /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/campaigns/review"
          element={isAuthenticated ? <MainLayout onLogout={handleLogout}><CampaignReview /></MainLayout> : <Navigate to="/login" replace />}
        />
        <Route
          path="/audit-log"
          element={isAuthenticated ? <MainLayout onLogout={handleLogout}><AuditLog /></MainLayout> : <Navigate to="/login" replace />}
        />

        {/* Step-based creation (special full-page view) */}
        <Route
          path="/campaigns/create"
          element={isAuthenticated ? <CreateCampaign /> : <Navigate to="/login" replace />}
        />

     
<Route
  path="/inbox"
  element={
    isAuthenticated ? (
      <MainLayout onLogout={handleLogout}>
        <CampaignInbox />
      </MainLayout>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
