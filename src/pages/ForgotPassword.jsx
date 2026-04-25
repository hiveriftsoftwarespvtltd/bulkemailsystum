import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import config from '../config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSent(true);
        Swal.fire({
          title: 'Link Sent!',
          text: 'Check your email for the password reset link.',
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          background: '#ffffff',
          borderRadius: '24px'
        });
      } else {
        throw new Error(data.message || 'Something went wrong');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-primary to-blue-600 rounded-[22px] mb-4 shadow-2xl shadow-primary/40 rotate-12">
            <ShieldCheck size={32} className="text-white -rotate-12" />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Security <span className="text-primary tracking-widest">Center</span></h1>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Password Recovery System</p>
        </div>

        <div className="bg-[#0f0f0f] border border-white/5 rounded-[40px] p-10 shadow-2xl backdrop-blur-xl">
          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Forgot Password?</h2>
                <p className="text-sm text-text-muted leading-relaxed">Enter your registered email below and we'll send you a recovery link.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-white/60 uppercase ml-1 tracking-widest">Your Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. vineet@gmail.com"
                      className="w-full bg-white/5 border border-white/5 p-4 pl-12 rounded-2xl outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-sm font-bold text-white placeholder:text-white/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-white h-[60px] rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>Send Recovery Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-all group">
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-8 py-4 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <Mail size={32} className="text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white tracking-tight">Email Sent!</h2>
                <p className="text-sm text-text-muted">We've sent a special recovery bond to <span className="text-white font-bold">{email}</span>. Please check your inbox.</p>
              </div>
              <div className="pt-4 flex flex-col gap-4">
                <button
                  onClick={() => setIsSent(false)}
                  className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Try another email
                </button>
                <Link to="/login">
                  <button className="w-full bg-white/5 text-white h-[55px] rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    Back to Login
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer Credit */}
        <p className="mt-10 text-center text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
          Protected by MailFlow Stealth Security
        </p>
      </div>
    </div>
  );
}
