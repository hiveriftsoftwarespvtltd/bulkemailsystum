import React, { useState, useEffect } from 'react';
import { X, Settings, Globe, Check, Loader2 } from 'lucide-react';
import AccountModal from './AccountModal';
import config from '../config';
import Swal from 'sweetalert2';

const SettingsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [campaignName, setCampaignName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchCampaignName = async () => {
            const campaignId = localStorage.getItem('current_campaign_id');
            if (isOpen && campaignId) {
                try {
                    const response = await fetch(`${config.API_BASE_URL}/create-campaign/${campaignId}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                    });
                    
                    if (response.status === 404) {
                        // Stale ID found, clear it to prevent further 404s
                        localStorage.removeItem('current_campaign_id');
                        localStorage.removeItem('draft_campaign_name');
                        return;
                    }

                    const result = await response.json();
                    if (response.ok && result.data?.name) {
                        setCampaignName(result.data.name);
                        localStorage.setItem('draft_campaign_name', result.data.name);
                    }
                } catch (error) {
                    console.error('Error fetching name:', error);
                }
            }
        };

        if (isOpen) {
            // Check local first for immediate feedback
            const localName = localStorage.getItem('draft_campaign_name');
            if (localName) setCampaignName(localName);
            
            // Then sync with server
            fetchCampaignName();
        }
    }, [isOpen]);

    const handleSaveName = async () => {
        const campaignId = localStorage.getItem('current_campaign_id');
        if (!campaignId) {
            Swal.fire('Error', 'Campaign ID not found', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${config.API_BASE_URL}/create-campaign/${campaignId}/name`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ name: campaignName })
            });

            if (response.ok) {
                localStorage.setItem('draft_campaign_name', campaignName);
                Swal.fire({
                    icon: 'success',
                    title: 'Name Updated!',
                    text: 'Campaign name has been saved successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
                onClose();
            } else {
                throw new Error('Failed to update name');
            }
        } catch (error) {
            console.error('Error updating campaign name:', error);
            Swal.fire('Error', 'Could not update campaign name', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200 font-sans">
            <div className="bg-white w-full max-w-[1000px] h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                
                {/* HEADER & TABS */}
                <div className="px-8 pt-6 border-b border-slate-100 shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                <Settings size={22} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase border-none">Campaign Global Settings</h2>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all border-none">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex gap-8 relative">
                        <button 
                            onClick={() => setActiveTab('general')}
                            className={`pb-3 text-[13px] font-black uppercase tracking-widest transition-all relative border-none outline-none ${activeTab === 'general' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            General Settings
                            {activeTab === 'general' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full"></div>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('accounts')}
                            className={`pb-3 text-[13px] font-black uppercase tracking-widest transition-all relative border-none outline-none ${activeTab === 'accounts' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Email Accounts
                            {activeTab === 'accounts' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-600 rounded-full"></div>}
                        </button>
                    </div>
                </div>

                {/* MODAL BODY */}
                <div className="flex-1 overflow-hidden bg-slate-50/10 flex flex-col">
                    
                    {activeTab === 'general' ? (
                        <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto custom-scrollbar">
                            {/* Campaign Name Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Primary Details</h4>
                                    <div className="h-px flex-1 bg-slate-100"></div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[13px] font-bold text-slate-700 ml-1">Campaign Name</label>
                                    <input 
                                        type="text" 
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        placeholder="Enter campaign name..."
                                        className="w-full bg-white border border-slate-200 px-5 py-4 rounded-2xl text-[15px] font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm transition-all focus:ring-4 focus:ring-indigo-500/5 placeholder:text-slate-300" 
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300 overflow-hidden">
                            <AccountModal isInline={true} onClose={onClose} />
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                {activeTab === 'general' && (
                    <div className="px-8 py-6 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                            <Check size={14} className="text-emerald-500" /> All changes will be saved to your campaign profile.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={onClose} className="px-6 py-3 text-[12px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all font-sans border-none">Cancel</button>
                            <button 
                                onClick={handleSaveName} 
                                disabled={isSaving}
                                className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-[12px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all font-sans flex items-center gap-2 border-none"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;
