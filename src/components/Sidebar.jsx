import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Send, Server, Mail, Activity  } from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20}/> },
    { path: '/email-accounts',  name: 'Email Accounts',  icon: <Mail size={20}/> },
    { path: '/campaigns', name: 'Email Campaigns', icon: <Send size={20}/> },
    { path: '/inbox', name: 'Unified Inbox', icon: <Mail size={20}/> }, // Yahan add kiya
    { path: '/audit-log', name: 'Audit Log', icon: <Activity size={20}/> },
  ];

  return (
    <aside className="w-64 bg-background border-r border-border fixed h-full shadow-sm">
      <div className="p-8">
        <h1 className="text-2xl font-black text-primary tracking-tight">MAILFLOW</h1>
      </div>
      
      <nav className="px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                ? 'bg-primary/5 text-primary shadow-sm font-bold' 
                : 'text-text-muted hover:bg-surface hover:text-text-main font-medium'
              }`
            }
          >
            {item.icon}
            <span className="tracking-tight">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
