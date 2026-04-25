import React, { useState } from 'react';
import { Send, Plus, Mail, Shield, Zap, ChevronRight, ArrowLeft } from 'lucide-react';
import SMTPForm from '../components/SMTPForm';

export default function SMTPAccounts() {
  const [view, setView] = useState('providers');

  if (view === 'form') {
    return <SMTPForm onBack={() => setView('providers')} />;
  }

  return (
    <div className="h-full flex flex-col bg-surface font-sans page-animate justify-center -mt-20">
      <div className="space-y-12 text-center shrink-0">
        <header className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-[1000] tracking-tightest mb-2 text-slate-800 uppercase">
            Choose your provider
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-medium leading-relaxed italic">Select an email network to initiate your high-conversion campaign.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto px-6">
          {/* Google Card */}
          <div className="bg-white border border-slate-100 p-12 flex flex-col items-center gap-6 text-center cursor-pointer hover:border-blue-200 group transition-all duration-300 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-blue-500/5">
            <div className="bg-slate-50 p-3 rounded-2xl flex shadow-sm group-hover:scale-110 transition-transform">
              <img src="https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png" alt="Google" className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Google OAuth</h3>
            <div className="text-blue-500 text-[10px] font-black uppercase tracking-widest pt-4 border-t border-slate-50 w-full">Click to Setup</div>
          </div>

          {/* Outlook Card */}
          <div className="bg-white border border-slate-100 p-12 flex flex-col items-center gap-6 text-center cursor-pointer hover:border-blue-200 group transition-all duration-300 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-blue-500/5">
            <div className="bg-slate-50 p-3 rounded-2xl flex shadow-sm group-hover:scale-110 transition-transform">
              <img src="https://mailmeteor.com/logos/assets/PNG/Microsoft_Office_Outlook_Logo_512px.png" alt="Outlook" className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Outlook</h3>
            <div className="text-blue-500 text-[10px] font-black uppercase tracking-widest pt-4 border-t border-slate-50 w-full">Click to Setup</div>
          </div>

          {/* SMTP Card - Active */}
          <div
            className="bg-white border-2 border-primary/20 p-12 flex flex-col items-center gap-6 text-center cursor-pointer hover:border-primary group transition-all duration-300 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-primary/10"
            onClick={() => setView('form')}
          >
            <div className="bg-primary p-3 rounded-2xl flex shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform rotate-3 group-hover:rotate-0">
              <Send size={40} className="text-white" />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight"> SMTP</h3>
            <div className="text-primary text-[10px] font-black uppercase tracking-widest pt-4 border-t border-slate-50 w-full underline decoration-2 underline-offset-4">Click to Setup</div>
          </div>
        </div>
      </div>
    </div>
  );
}
