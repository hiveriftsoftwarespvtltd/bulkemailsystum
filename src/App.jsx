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
import { LogOut, User, ChevronDown } from 'lucide-react';
import config from './config';
import CampaignInbox from './pages/CampaignInbox';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        {/* --- HEADER --- */}
        {!isCampaignFlow && (
          <header className="px-10 py-5 flex justify-between items-center border-b border-border bg-background shadow-sm z-50 shrink-0">
            <div className="space-y-0.5">
              <h2 className="text-xl font-extrabold text-text-main tracking-tight font-heading">
                Email Marketing System
              </h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Campaign Control Center</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="h-8 w-px bg-border hidden md:block"></div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 p-1 pr-3 hover:bg-surface rounded-2xl transition-all"
                >
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-primary/20">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-black text-text-main leading-tight font-sans">{user.fullName || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-text-muted leading-tight font-sans">{user.email || 'admin@mailflow.com'}</p>
                  </div>
                  <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-64 bg-background rounded-3xl shadow-2xl border border-border p-3 z-50 fade-in">
                      <div className="p-4 border-b border-border mb-2">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Logged in as</p>
                        <p className="text-sm font-bold text-text-main truncate font-sans">{user.email}</p>
                      </div>

                      {/* <button className="w-full flex items-center gap-3 p-3 text-text-muted hover:bg-surface rounded-2xl transition-all text-sm font-bold font-sans">
                          <User size={18} /> My Profile
                       </button> */}

                      <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all text-sm font-bold mt-1 font-sans"
                      >
                        <LogOut size={18} /> Logout Session
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
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
