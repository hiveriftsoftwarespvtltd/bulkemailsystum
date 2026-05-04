import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  Settings, 
  HelpCircle,
  Menu
} from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-6 md:px-10">
        
        {/* Left Section: Search Bar */}
        <div className="flex flex-1 items-center gap-4">
          <div className="relative group hidden md:block w-72">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Search campaigns, leads..." 
              className="w-full bg-surface border border-border rounded-2xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-text-muted/60"
            />
          </div>
          <button className="md:hidden p-2 hover:bg-surface rounded-xl text-text-muted">
            <Menu size={20} />
          </button>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-2 md:gap-5">
          
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2.5 text-text-muted hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
            >
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-background rounded-full"></span>
            </button>
            
            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-80 bg-background rounded-3xl shadow-2xl border border-border p-4 z-50 fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Mark all as read</button>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-surface rounded-2xl border border-border/50 hover:border-primary/30 transition-all cursor-pointer">
                      <p className="text-xs font-bold text-text-main">Campaign "Spring Sale" completed</p>
                      <p className="text-[10px] text-text-muted mt-1">10 minutes ago</p>
                    </div>
                    <div className="p-3 hover:bg-surface rounded-2xl transition-all cursor-pointer">
                      <p className="text-xs font-medium text-text-main">New SMTP account verified</p>
                      <p className="text-[10px] text-text-muted mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-8 w-px bg-border/60 mx-1"></div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 p-1.5 pl-1.5 pr-4 hover:bg-surface rounded-2xl transition-all border border-transparent hover:border-border/50 group"
            >
              <div className="relative">
                <div className="w-9 h-9 bg-gradient-to-tr from-primary to-primary/60 rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full"></div>
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-black text-text-main leading-tight tracking-tight">{user?.fullName || 'Admin'}</p>
                <p className="text-[10px] font-bold text-text-muted leading-tight">{user?.email || 'admin@mailflow.com'}</p>
              </div>
              <ChevronDown size={14} className={`text-text-muted transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-64 bg-background rounded-3xl shadow-2xl border border-border p-2 z-50 fade-in overflow-hidden">
                  <div className="px-4 py-4 border-b border-border mb-1 bg-surface/50">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Account Workspace</p>
                    <p className="text-sm font-bold text-text-main truncate">{user?.email}</p>
                  </div>

                  <div className="p-1 space-y-1">
                    <button className="w-full flex items-center gap-3 p-3 text-text-muted hover:text-primary hover:bg-primary/5 rounded-2xl transition-all text-sm font-bold">
                      <User size={18} /> Profile Settings
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 text-text-muted hover:text-primary hover:bg-primary/5 rounded-2xl transition-all text-sm font-bold">
                      <Settings size={18} /> API Configuration
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 text-text-muted hover:text-primary hover:bg-primary/5 rounded-2xl transition-all text-sm font-bold">
                      <HelpCircle size={18} /> Documentation
                    </button>
                  </div>

                  <div className="mt-1 p-1 border-t border-border">
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all text-sm font-bold"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
