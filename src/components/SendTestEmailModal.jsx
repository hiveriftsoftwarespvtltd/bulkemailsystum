import React, { useState, useEffect } from 'react';
import { X, Mail, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import config from '../config';
import Swal from 'sweetalert2';

const SendTestEmailModal = ({ isOpen, onClose, campaignId, subject, body }) => {
    const [testEmail, setTestEmail] = useState('');
    const [selectedSenderId, setSelectedSenderId] = useState('');
    const [senders, setSenders] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [isLoadingSenders, setIsLoadingSenders] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchSenders();
            // Default receiver email from user profile or draft if any
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.email) setTestEmail(user.email);
        }
    }, [isOpen]);

    const fetchSenders = async () => {
        setIsLoadingSenders(true);
        try {
            const response = await fetch(`${config.API_BASE_URL}/smtp-sender`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            if (response.ok) {
                const result = await response.json();
                const activeSenders = result.data || [];
                setSenders(activeSenders);
                if (activeSenders.length > 0) setSelectedSenderId(activeSenders[0]._id);
            }
        } catch (error) {
            console.error("Error fetching senders:", error);
        } finally {
            setIsLoadingSenders(false);
        }
    };

    const handleSendTest = async () => {
        if (!testEmail || !selectedSenderId) {
            Swal.fire('Warning', 'Please select a sender and enter a recipient email.', 'warning');
            return;
        }

        const selectedSender = senders.find(s => s._id === selectedSenderId);
        if (!selectedSender) return;

        setIsSending(true);
        try {
            const response = await fetch(`${config.API_BASE_URL}/create-campaign/test-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({
                    smtpAccountId: selectedSender.fromEmail, // Using the email as requested
                    testEmail: testEmail,
                    subject: subject,
                    body: body
                })
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Test Email Sent!',
                    text: `Check your inbox at ${testEmail}`,
                    timer: 2000,
                    showConfirmButton: false
                });
                onClose();
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to send test email');
            }
        } catch (error) {
            console.error("Test email error:", error);
            Swal.fire('Error', error.message || 'Could not send test email. Please check your SMTP settings.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] font-sans animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[550px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                
                {/* HEADER */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">Send Test Email</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all border-none">
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    <div className="space-y-4">
                        <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                            Edit the email account if you want to send to a different email.
                        </p>
                        
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-700 leading-normal uppercase tracking-wider">
                                PS. Do not use this as a mechanism for testing email deliverability. Use this for testing formatting and copy.
                            </p>
                        </div>
                    </div>

                    {/* Sender Selection */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Email Account</label>
                        <div className="relative">
                            <select 
                                value={selectedSenderId}
                                onChange={(e) => setSelectedSenderId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            >
                                {isLoadingSenders ? (
                                    <option>Loading accounts...</option>
                                ) : (
                                    senders.map(acc => (
                                        <option key={acc._id} value={acc._id}>{acc.fromEmail}</option>
                                    ))
                                )}
                                {senders.length === 0 && !isLoadingSenders && <option>No SMTP accounts found</option>}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Recipient Input */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Recipient Email</label>
                        <input 
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="Enter recipient email..."
                            className="w-full bg-white border border-slate-200 px-5 py-3.5 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm transition-all focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-300" 
                        />
                    </div>
                </div>

                {/* FOOTER */}
                <div className="px-8 py-6 border-t border-slate-100 bg-white flex flex-col gap-3">
                    <button 
                        onClick={handleSendTest}
                        disabled={isSending || senders.length === 0}
                        className="w-full h-12 bg-indigo-600 text-white rounded-xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 border-none disabled:opacity-50 disabled:translate-y-0"
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {isSending ? 'Sending Test...' : 'Send Test Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Internal icon for select
const ChevronDown = ({ className, size }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

export default SendTestEmailModal;
