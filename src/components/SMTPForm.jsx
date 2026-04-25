import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Globe, Lock, Mail, Shield, Zap, Clock, ShieldCheck, CheckCircle2, Loader2, Info, Send } from 'lucide-react';
import Swal from 'sweetalert2';
import config from '../config';

export default function SMTPForm({ onBack, accountId }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    fromName: '',
    fromEmail: '',
    userName: '',
    password: '',
    smtpHost: '',
    smtpPort: 465,
    smtpSecurity: 'SSL',
    messagePerDay: 25,
    minTimeGap: 1,
    useCustomReplyTo: false,
    replyTo: ''
  });

  // Fetch single account if accountId is provided
  useEffect(() => {
    if (accountId) {
      const fetchSingleAccount = async () => {
        setFetching(true);
        try {
          const response = await fetch(`${config.API_BASE_URL}/smtp-sender/${accountId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setFormData({
              ...data,
              messagePerDay: data.messagePerDay || 25,
              minTimeGap: data.minTimeGap || 1,
              smtpPort: data.smtpPort || 465,
              smtpSecurity: data.smtpSecurity || 'SSL'
            });
          }
        } catch (error) {
          console.error("Error fetching account details:", error);
        } finally {
          setFetching(false);
        }
      };
      fetchSingleAccount();
    }
  }, [accountId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = accountId 
        ? `${config.API_BASE_URL}/smtp-sender/${accountId}` 
        : `${config.API_BASE_URL}/smtp-sender`;
      
      const method = accountId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          title: 'Success!',
          text: accountId ? 'SMTP Account updated successfully' : 'SMTP Account added successfully',
          icon: 'success',
          confirmButtonColor: '#4f46e5'
        }).then(() => {
          if (accountId && onBack) {
            onBack(); // Close inline editor and refresh list
          } else {
            navigate('/email-accounts');
          }
        });
      } else {
        throw new Error(data.message || 'Failed to save SMTP settings');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto page-animate h-full flex flex-col pb-10">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-all font-bold group"
        >
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-border group-hover:bg-primary/5 group-hover:border-primary/20">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
          </div>
          <span className="text-[11px] uppercase tracking-widest">Back to Provider</span>
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-text-main tracking-tighter uppercase mb-1">
            {accountId ? 'Edit Connection' : 'SMTP Configuration'}
          </h2>
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">
            {accountId ? 'Update your server settings' : 'Connect any custom SMTP/IMAP server'}
          </p>
        </div>
      </div>

      {fetching ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 bg-background rounded-[40px] border border-border">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest animate-pulse">Fetching account details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT COLUMN: SMTP Settings */}
          <div className="space-y-6">
            <div className="bg-background rounded-[40px] border border-border shadow-soft p-8 space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                 <Send size={120} />
               </div>

               {/* Sender Identity */}
               <section className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-border pb-4">
                   <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                     <Mail size={20} />
                   </div>
                   <div>
                     <h3 className="font-black uppercase text-[11px] tracking-[0.15em] text-text-main">Sender Identity</h3>
                     <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">How recipients see your emails</p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">From Name</label>
                     <input 
                       required
                       name="fromName"
                       value={formData.fromName}
                       onChange={handleChange}
                       type="text" 
                       placeholder="e.g. Vineet" 
                       className="w-full bg-surface border border-border p-3 rounded-2xl focus:border-primary focus:bg-background outline-none transition-all text-sm font-bold text-text-main" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">From Email</label>
                     <input 
                       required
                       name="fromEmail"
                       value={formData.fromEmail}
                       onChange={handleChange}
                       type="email" 
                       placeholder="user@domain.com" 
                       className="w-full bg-surface border border-border p-3 rounded-2xl focus:border-primary focus:bg-background outline-none transition-all text-sm font-bold text-text-main" 
                     />
                   </div>
                 </div>
               </section>

               {/* SMTP Server Configuration */}
               <section className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-border pb-4">
                   <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                     <Globe size={20} />
                   </div>
                   <div>
                     <h3 className="font-black uppercase text-[11px] tracking-[0.15em] text-text-main">SMTP Server</h3>
                     <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Outgoing Mail Server Details</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">SMTP Host</label>
                     <input 
                       required
                       name="smtpHost"
                       value={formData.smtpHost}
                       onChange={handleChange}
                       type="text" 
                       placeholder="smtp.gmail.com" 
                       className="w-full bg-surface border border-border p-3 rounded-2xl focus:border-primary focus:bg-background outline-none transition-all text-sm font-bold text-text-main" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">Auth Username</label>
                     <input 
                       required
                       name="userName"
                       value={formData.userName}
                       onChange={handleChange}
                       type="text" 
                       placeholder="user@domain.com" 
                       className="w-full bg-surface border border-border p-3 rounded-2xl focus:border-primary focus:bg-background outline-none transition-all text-sm font-bold text-text-main" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">Auth Password</label>
                     <input 
                       required
                       name="password"
                       value={formData.password}
                       onChange={handleChange}
                       type="password" 
                       placeholder="••••••••" 
                       className="w-full bg-surface border border-border p-3 rounded-2xl focus:border-primary focus:bg-background outline-none transition-all text-sm font-bold text-text-main" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">Port</label>
                     <input 
                       name="smtpPort"
                       value={formData.smtpPort}
                       onChange={handleChange}
                       type="number" 
                       className="w-full bg-surface border border-border p-3 rounded-2xl outline-none text-sm font-bold text-text-main" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">Security</label>
                     <select 
                       name="smtpSecurity"
                       value={formData.smtpSecurity}
                       onChange={handleChange}
                       className="w-full bg-surface border border-border p-3 rounded-2xl outline-none cursor-pointer font-bold text-sm text-text-main"
                     >
                       <option value="SSL">SSL</option>
                       <option value="TLS">TLS</option>
                       <option value="NONE">None</option>
                     </select>
                   </div>
                 </div>
               </section>
            </div>
          </div>

          {/* RIGHT COLUMN: Limits & IMAP */}
          <div className="space-y-6">
            <div className="bg-background rounded-[40px] border border-border shadow-soft p-8 space-y-8">
               
               {/* Sending Throttling */}
               <section className="space-y-6">
                 <div className="flex items-center gap-3 border-b border-border pb-4">
                   <div className="w-10 h-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-500 border border-amber-500/10">
                     <Zap size={20} />
                   </div>
                   <div>
                     <h3 className="font-black uppercase text-[11px] tracking-[0.15em] text-text-main">Throttling</h3>
                     <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Daily limits & delivery gaps</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">Daily Limit</label>
                     <input 
                       name="messagePerDay"
                       value={formData.messagePerDay}
                       onChange={handleChange}
                       type="number" 
                       className="w-full bg-surface border border-border p-3 rounded-2xl outline-none text-sm font-bold text-text-main" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-text-main uppercase ml-1 tracking-widest">Min Gap (Sec)</label>
                     <input 
                       name="minTimeGap"
                       value={formData.minTimeGap}
                       onChange={handleChange}
                       type="number" 
                       className="w-full bg-surface border border-border p-3 rounded-2xl outline-none text-sm font-bold text-text-main" 
                     />
                   </div>
                 </div>
               </section>

               {/* Custom Reply-To */}
               <section className="bg-surface/50 p-6 rounded-3xl border border-border border-dashed">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                     <Shield size={16} className="text-primary" />
                     <h4 className="text-[10px] font-black text-text-main uppercase tracking-widest">Custom Reply Address</h4>
                   </div>
                   <div className="relative inline-block w-10 h-6">
                     <input 
                       checked={formData.useCustomReplyTo}
                       onChange={handleChange}
                       name="useCustomReplyTo"
                       type="checkbox" 
                       className="peer hidden" 
                       id="replyToggle" 
                     />
                     <label 
                       htmlFor="replyToggle" 
                       className="block bg-border rounded-full h-full w-full cursor-pointer transition-all peer-checked:bg-primary"
                     ></label>
                     <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-4"></div>
                   </div>
                 </div>
                 {formData.useCustomReplyTo && (
                   <input 
                     name="replyTo"
                     value={formData.replyTo}
                     onChange={handleChange}
                     type="email" 
                     placeholder="reply@domain.com" 
                     className="w-full bg-background border border-border p-3 rounded-2xl outline-none fade-in font-bold text-sm text-text-main" 
                   />
                 )}
               </section>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary text-white h-[70px] rounded-[24px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <CheckCircle2 size={24} />
                  <span>{accountId ? 'Update & Sync Account' : 'Connect & Save SMTP'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      )}
    </div>
  );
}
