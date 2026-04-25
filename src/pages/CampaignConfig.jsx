import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, CheckCircle2, Send, Upload, FileText, Layout, Mail, Clock, Sliders } from 'lucide-react';
import AccountModal from '../components/AccountModal';
import ScheduleModal from '../components/ScheduleModal';
import SettingsModal from '../components/SettingsModal';
import config from '../config';

const CampaignConfig = () => {
    const navigate = useNavigate();
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isGlobalSettingsOpen, setIsGlobalSettingsOpen] = useState(false);

    // Dynamic states for green badges and data sync
    const [isSenderReady, setIsSenderReady] = useState(false);
    const [isScheduleReady, setIsScheduleReady] = useState(false);
    const [isSettingsReady, setIsSettingsReady] = useState(false);

    const [selectedSenderIds, setSelectedSenderIds] = useState([]);
    const [scheduleData, setScheduleData] = useState(null);

    useEffect(() => {
        const campaignId = localStorage.getItem('current_campaign_id');

        const fetchExistingConfig = async () => {
            if (!campaignId) return;

            try {
                const response = await fetch(`${config.API_BASE_URL}/create-campaign/${campaignId}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                const result = await response.json();

                if (response.ok && result.data) {
                    const campaign = result.data;

                    // 1. Check Sender (Robust check for multiple field names)
                    const sId = campaign.smtpAccountId || campaign.smtpAccount || campaign.senderId || campaign.sender;
                    const finalId = (typeof sId === 'object') ? sId?._id : sId;
                    const finalEmail = (typeof sId === 'object') ? sId?.fromEmail : null;

                    if (finalId) {
                        setIsSenderReady(true);
                        setSelectedSenderIds([finalId]);
                        localStorage.setItem('selected_sender_ids', JSON.stringify([finalId]));
                        if (finalEmail) {
                            localStorage.setItem('selected_sender_emails', JSON.stringify([finalEmail]));
                        }
                    } else if (['SENDING', 'PAUSED', 'COMPLETED', 'SCHEDULED'].includes(campaign.status)) {
                        setIsSenderReady(true);
                    }

                    // 2. Check Schedule
                    try {
                        const schedResp = await fetch(`${config.API_BASE_URL}/schedule-campaign/${campaignId}`, {
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                        });
                        if (schedResp.ok) {
                            const schedData = await schedResp.json();
                            if (schedData.data) {
                                setIsScheduleReady(true);
                                setScheduleData(schedData.data);
                                localStorage.setItem('draft_schedule', JSON.stringify(schedData.data));
                            }
                        } else if (['SENDING', 'PAUSED', 'COMPLETED', 'SCHEDULED'].includes(campaign.status)) {
                            setIsScheduleReady(true);
                        }
                    } catch (e) { console.warn("No existing schedule found"); }

                    // 3. Check Design/Content
                    if (campaign.body || campaign.subject) {
                        setIsSettingsReady(true);
                        if (campaign.body) localStorage.setItem('draft_editor_data', campaign.body);
                        if (campaign.subject) localStorage.setItem('draft_subject', campaign.subject);
                        if (campaign.name) localStorage.setItem('draft_campaign_name', campaign.name);

                        // 4. Hydrate Leads and Mapping for Steps 1 & 2
                        if (campaign.filePath) {
                            localStorage.setItem('draft_file_data', JSON.stringify({
                                path: campaign.filePath,
                                name: campaign.name || 'campaign_file.csv'
                            }));
                        }

                        if (campaign.columns && campaign.columns.length > 0) {
                            localStorage.setItem('draft_csv_headers', JSON.stringify(campaign.columns));
                        } else if (campaign.contacts && campaign.contacts.length > 0) {
                            const extracted = Object.keys(campaign.contacts[0]);
                            localStorage.setItem('draft_csv_headers', JSON.stringify(extracted));
                        }

                        if (campaign.contacts) {
                            localStorage.setItem('draft_total_leads', campaign.contacts.length.toString());
                        }

                        if (campaign.companyField) localStorage.setItem('draft_company_field', campaign.companyField);
                        if (campaign.ownerField) localStorage.setItem('draft_owner_field', campaign.ownerField);
                        if (campaign.emailField) localStorage.setItem('draft_email_field', campaign.emailField);
                    }
                }
            } catch (error) {
                console.error("Error hydrating config:", error);
            }
        };

        fetchExistingConfig();
    }, []);

    const steps = [
        { id: 1, title: 'Import Leads', icon: <Upload size={16} /> },
        { id: 2, title: 'Mapping Leads', icon: <FileText size={16} /> },
        { id: 3, title: 'Campaign Setup', icon: <Layout size={16} /> },
        { id: 4, title: 'Final Config', icon: <Sliders size={16} /> },
    ];

    const configOptions = [
        {
            id: 'sender',
            title: 'Sender Accounts',
            description: 'Select the email accounts that will send the campaign.',
            buttonText: isSenderReady ? 'Change Accounts' : 'Choose Accounts',
            icon: <Mail size={22} className={isSenderReady ? "text-emerald-500" : "text-slate-400"} />,
            status: isSenderReady ? 'READY' : 'PENDING',
            isReady: isSenderReady,
            onClick: () => {
                setIsAccountModalOpen(true);
                setIsSenderReady(true);
            }
        },
        {
            id: 'schedule',
            title: 'Campaign Schedule',
            description: 'Define the timeframe and frequency for your outreach.',
            buttonText: isScheduleReady ? 'Edit Schedule' : 'Set Schedule',
            icon: <Clock size={22} className={isScheduleReady ? "text-emerald-500" : "text-slate-400"} />,
            status: isScheduleReady ? 'READY' : 'PENDING',
            isReady: isScheduleReady,
            onClick: () => {
                setIsScheduleModalOpen(true);
                setIsScheduleReady(true);
            }
        },
        {
            id: 'settings',
            title: 'Global Settings',
            description: 'Manage tracking, unsubscribe links, and custom headers.',
            buttonText: isSettingsReady ? 'Edit Settings' : 'Configure',
            icon: <Sliders size={22} className={isSettingsReady ? "text-emerald-500" : "text-slate-400"} />,
            status: isSettingsReady ? 'READY' : 'DEFAULT',
            isReady: isSettingsReady,
            onClick: () => {
                setIsGlobalSettingsOpen(true);
                setIsSettingsReady(true);
            }
        }
    ];

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* --- FIXED TOP NAV --- */}
            <nav className="h-[100px] border-b border-slate-100 flex items-center justify-between px-12 md:px-20 bg-white/80 backdrop-blur-xl sticky top-0 z-[100]">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 rounded-[20px] bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all border border-slate-100/50"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-[1000] text-slate-800 tracking-tightest uppercase">Final Configuration</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Complete the last steps to launch</p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-4">
                    {steps.map((step, idx) => (
                        <React.Fragment key={step.id}>
                            <div className={`flex items-center gap-3 p-1 pr-5 rounded-2xl transition-all border ${step.id === 4
                                ? 'bg-primary/5 border-primary/10 shadow-sm'
                                : 'bg-slate-50/50 border-transparent grayscale opacity-40'
                                }`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${step.id === 4 ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {step.id < 4 ? <CheckCircle2 size={16} strokeWidth={3} /> : step.icon}
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Step 0{step.id}</p>
                                    <p className={`text-[11px] font-[900] uppercase tracking-wider leading-none ${step.id === 4 ? 'text-primary' : 'text-slate-400'}`}>{step.title}</p>
                                </div>
                            </div>
                            {idx < steps.length - 1 && <div className="w-12 h-px bg-slate-100"></div>}
                        </React.Fragment>
                    ))}
                </div>

                <button
                    onClick={() => navigate('/campaigns')}
                    className="p-4 hover:bg-slate-50 rounded-2xl transition-all text-slate-300 hover:text-slate-400 group"
                >
                    <X size={26} className="group-rotate-90 transition-transform" />
                </button>
            </nav>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar bg-slate-50/30">
                <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-10 md:p-16 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="relative z-10 space-y-12 text-center">
                        <h3 className="text-4xl font-[600] text-slate-800 tracking-tightest uppercase">Launch Parameters</h3>
                        <div className="grid grid-cols-1 gap-6 text-left">
                            {configOptions.map((option) => (
                                <div key={option.id} className="group relative bg-white border border-slate-100 hover:border-blue-200 p-8 rounded-[32px] transition-all hover:shadow-2xl hover:shadow-primary/5/50 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-8 text-center md:text-left">
                                        <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center transition-all shadow-inner group-hover:rotate-6 ${option.isReady ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-primary/5 group-hover:text-primary'
                                            }`}>
                                            {option.icon}
                                        </div>
                                        <div className="space-y-1.5 px-1">
                                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                                <h4 className="text-xl  text-slate-800 uppercase ">{option.title}</h4>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${option.isReady
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                                                    : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                    {option.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 leading-relaxed">{option.description}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={option.onClick}
                                        className={`min-w-[180px] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all ${option.isReady
                                            ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-slate-100'
                                            : 'bg-primary text-white hover:bg-primary/80 shadow-primary/10 hover:-translate-y-1'
                                            }`}
                                    >
                                        {option.buttonText}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- FOOTER ACTIONS --- */}
            <footer className="bg-background border-t border-border px-10 py-6 flex justify-between items-center shrink-0 z-20">
                <button
                    onClick={() => navigate('/campaigns/create?step=3')}
                    className="flex items-center gap-3 text-xs font-black text-text-muted uppercase tracking-widest hover:text-text-main transition-all px-4 py-2 hover:bg-slate-50 rounded-xl"
                >
                    <ArrowLeft size={18} strokeWidth={2.5} /> Go back to Sequence
                </button>

                <div className="flex items-center gap-8">
                    <button
                        onClick={() => navigate('/campaigns/review')}
                        className="bg-primary text-white h-[60px] px-12 rounded-[24px] text-[11px] font-[900] uppercase tracking-[0.25em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-4 group"
                    >
                        Finalize & Launch
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <Send size={16} />
                        </div>
                    </button>
                </div>
            </footer>

            {/* Modals */}
            <AccountModal
                isOpen={isAccountModalOpen}
                onClose={() => setIsAccountModalOpen(false)}
                campaignId={localStorage.getItem('current_campaign_id')}
                initialSelectedIds={selectedSenderIds}
                onSelectAccounts={(ids) => {
                    setSelectedSenderIds(ids);
                    setIsSenderReady(true);
                }}
            />

            <ScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                campaignId={localStorage.getItem('current_campaign_id')}
                initialScheduleData={scheduleData}
                onSaveSuccess={(data) => {
                    setScheduleData(data);
                    setIsScheduleReady(true);
                }}
            />

            <SettingsModal
                isOpen={isGlobalSettingsOpen}
                onClose={() => setIsGlobalSettingsOpen(false)}
                campaignId={localStorage.getItem('current_campaign_id')}
            />
        </div>
    );
};

export default CampaignConfig;



