import React, { useState, useEffect } from 'react';
import { Mail, Search, MessageSquare, ArrowLeft, Send, CheckCircle2, Loader2, User, Filter } from 'lucide-react';
import config from '../config';

const CampaignInbox = ({ campaignId, onBack }) => {
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [messages, setMessages] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 1. Fetch all leads with active conversations for this campaign
    useEffect(() => {
        // API: GET /inbox/campaign/:campaignId
        // Mocking for now: setLeads(...)
    }, [campaignId]);

    // 2. Fetch specific thread when a lead is selected
    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        // API: GET /inbox/thread/:campaignId/:leadId
        // setMessages(...)
    };

    return (
        <div className="flex h-screen bg-white font-sans overflow-hidden">
            
            {/* LEFT SIDEBAR: Lead List */}
            <div className="w-[350px] border-r border-slate-100 flex flex-col shrink-0">
                <div className="p-6 border-b border-slate-100">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase tracking-widest mb-4 hover:text-slate-800 transition-all">
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Campaign Inbox</h2>
                </div>
                
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-none" placeholder="Search leads..." />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Map leads here */}
                    <div onClick={() => handleSelectLead({id: 1, name: 'Vineet'})} className="p-5 border-b border-slate-50 cursor-pointer hover:bg-slate-50">
                        <p className="font-black text-sm">Vineet Kumar</p>
                        <p className="text-[11px] text-slate-400 truncate">I'm interested in your offer...</p>
                    </div>
                </div>
            </div>

            {/* RIGHT AREA: Conversation Thread */}
            <div className="flex-1 flex flex-col bg-[#FDFDFF]">
                {selectedLead ? (
                    <>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black">V</div>
                                <div>
                                    <h3 className="font-black text-sm">{selectedLead.name}</h3>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase">Active Conversation</p>
                                </div>
                            </div>
                        </div>

                        {/* Thread Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-xl">
                                <p className="text-sm font-medium text-slate-700 leading-relaxed">Hi, I'd like to know more about the MailFlow integration.</p>
                                <span className="text-[9px] text-slate-300 mt-2 block">10:30 AM</span>
                            </div>
                        </div>

                        {/* Reply Input */}
                        <div className="p-6 bg-white border-t border-slate-100">
                            <div className="relative">
                                <textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-16 text-sm font-medium h-24 resize-none outline-none focus:border-primary"
                                />
                                <button className="absolute right-4 bottom-4 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-all">
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <Mail size={48} className="mb-4 opacity-30" />
                        <p className="text-xs font-black uppercase tracking-widest">Select a lead to start conversation</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignInbox;