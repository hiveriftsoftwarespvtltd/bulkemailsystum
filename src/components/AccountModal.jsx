import React, { useState, useEffect } from 'react';
import { X, Filter, ExternalLink, Search, Plus, HelpCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import config from '../config';

const AccountModal = ({ isOpen, onClose, isInline = false, onSelectAccounts, initialSelectedIds = [] }) => {
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${config.API_BASE_URL}/smtp-sender`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            if (response.ok) {
                const result = await response.json();
                setAccounts(result.data || []);
            }
        } catch (error) {
            console.error("Error fetching accounts for modal:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const syncSelection = () => {
            if (initialSelectedIds && initialSelectedIds.length > 0) {
                setSelectedIds(initialSelectedIds);
                return;
            }

            const savedIds = localStorage.getItem('selected_sender_ids');
            if (savedIds) {
                try {
                    const parsed = JSON.parse(savedIds);
                    if (Array.isArray(parsed)) {
                        setSelectedIds(parsed);
                    }
                } catch (e) {
                    console.error("Error parsing saved account IDs", e);
                }
            }
        };

        if (isOpen || isInline) {
            fetchAccounts();
            syncSelection();
        }
    }, [isOpen, isInline, initialSelectedIds]);

    if (!isOpen && !isInline) return null;

    const filteredAccounts = accounts.filter(acc => 
        acc.fromName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.fromEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredAccounts.map(acc => acc._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSaveSelection = () => {
        const selectedEmails = accounts.filter(acc => selectedIds.includes(acc._id)).map(acc => acc.fromEmail);
        localStorage.setItem('selected_sender_emails', JSON.stringify(selectedEmails));

        // Persist to localStorage
        localStorage.setItem('selected_sender_ids', JSON.stringify(selectedIds));
        
        if (onSelectAccounts) {
            onSelectAccounts(selectedIds);
        }
        onClose();
    };

    // Original Gmail SVG Icon
    const GmailIcon = () => (
        <svg fill="none" viewBox="0 0 18 14" height="14px" width="16px" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M1.2273 13.5032H4.09092V6.54866L0 3.48047V12.276C0 12.954 0.549211 13.5033 1.2273 13.5033V13.5032Z" fill="#4285F4"></path>
            <path d="M13.9091 13.5032H16.7727C17.4508 13.5032 18 12.954 18 12.2759V3.48047L13.9091 6.54866V13.5032Z" fill="#34A853"></path>
            <path d="M13.9091 1.23057V6.54876L18 3.48057V1.84422C18 0.32751 16.2685 -0.53874 15.0545 0.371491L13.9091 1.23057Z" fill="#FBBC04"></path>
            <path fillRule="evenodd" clipRule="evenodd" d="M4.09091 6.5489V1.23071L8.99999 4.91256L13.9091 1.23071V6.5489L8.99999 10.2307L4.09091 6.5489Z" fill="#EA4335"></path>
            <path d="M0 1.84422V3.48057L4.09092 6.54876V1.23057L2.94546 0.371492C1.73145 -0.538738 0 0.327512 0 1.84415V1.84422Z" fill="#C5221F"></path>
        </svg>
    );

    const tableContent = (
        <div className={`flex flex-col overflow-hidden bg-white ${isInline ? 'h-full' : 'max-h-[60vh]'}`}>
            {/* 1. TOP ACTION BAR */}
            <div className="px-6 py-3.5 flex items-center justify-between gap-4 shrink-0 border-b border-[#0000001f] bg-white">
                <p className="text-[13px] font-bold text-slate-700">Email List <span className="text-[#0000008a] font-normal">({filteredAccounts.length})</span></p>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            placeholder="Search Email Account"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-[240px] bg-white border border-[#0000001f] pl-9 pr-4 py-1.5 rounded-md text-[13px] outline-none focus:border-[#5f49e0] placeholder:text-slate-400 font-medium transition-all"
                        />
                    </div>
                    <button className="p-1.5 border border-[#0000001f] rounded-md hover:bg-slate-50 text-[#9699B0]">
                        <Filter size={16} />
                    </button>
                    <Link to="/smtp">
                        <button className="px-4 py-1.5 text-[12px] font-bold text-slate-700 bg-white border border-[#0000001f] rounded hover:bg-slate-50 transition-colors">
                            Connect Mailbox
                        </button>
                    </Link>
                </div>
            </div>

            {/* 2. SCROLLABLE TABLE BODY */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-white">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-primary" size={32} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading accounts...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead className="bg-white sticky top-0 z-10">
                            <tr className="border-b border-[#0000001f] text-[11px] font-bold text-[#0000008a] uppercase tracking-wider">
                                <th className="px-6 py-3 w-14">
                                    <input 
                                        type="checkbox" 
                                        onChange={handleSelectAll}
                                        checked={filteredAccounts.length > 0 && selectedIds.length === filteredAccounts.length}
                                        className="w-4 h-4 accent-[#5f49e0] rounded border-[#0000003d]" 
                                    />
                                </th>
                                <th className="px-4 py-3">Name & Email</th>
                                <th className="px-4 py-3 text-center">Security</th>
                                <th className="px-4 py-3 text-center">Min. Time Gap (secs) <HelpCircle size={12} className="inline ml-1 text-slate-300" /></th>
                                <th className="px-4 py-3 text-center">Daily Limit <HelpCircle size={12} className="inline ml-1 text-slate-300" /></th>
                                <th className="px-4 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#0000000f]">
                            {filteredAccounts.map((acc) => (
                                <tr 
                                    key={acc._id} 
                                    className={`group hover:bg-[#00000005] transition-colors h-[56px] cursor-pointer ${selectedIds.includes(acc._id) ? 'bg-primary/5' : ''}`}
                                    onClick={() => handleSelectRow(acc._id)}
                                >
                                    <td className="px-6 py-2">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(acc._id)}
                                            onChange={() => {}} // Controlled by row click
                                            className="w-4 h-4 accent-[#5f49e0] rounded" 
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px] font-bold text-[#000000de]">{acc.fromName}</span>
                                            <ExternalLink size={12} className="text-[#0000008a]" />
                                            <span className="bg-[#21BA45] text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none uppercase">Online</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <GmailIcon />
                                            <span className="text-[12.5px] text-[#0000008a] font-medium truncate max-w-[300px]">{acc.fromEmail}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-center text-[12px] font-black text-blue-600 bg-blue-50/50 rounded">{acc.smtpSecurity}</td>
                                    <td className="px-4 py-2 text-[13px] font-bold text-[#000000de] text-center">{acc.minTimeGap}s</td>
                                    <td className="px-4 py-2 text-[13px] font-bold text-[#000000de] text-center">{acc.messagePerDay}</td>
                                    <td className="px-4 py-2 text-center">
                                       <span className="text-[10px] font-black text-emerald-600 uppercase">Premium</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 3. FOOTER */}
            <div className="px-8 py-4 border-t border-[#0000001f] flex justify-end shrink-0 bg-white">
                <button
                    onClick={handleSaveSelection}
                    className="bg-[#5f49e0] text-white px-10 py-2.5 rounded-lg text-[13px] font-black uppercase tracking-widest shadow-lg shadow-purple-100 hover:bg-[#4f38d0] transition-all active:scale-95"
                >
                    Save Selection ({selectedIds.length})
                </button>
            </div>
        </div>
    );

    if (isInline) return tableContent;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#00011566] backdrop-blur-[1px] font-sans animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-6xl h-[85vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-[#E2E8F0]">
                {/* TAB NAVIGATION HEADER */}
                <div className="px-8 pt-6 border-b border-[#F1F5F9] shrink-0 bg-white">
                    <div className="flex justify-between items-start mb-6">
                        <h2 className="text-[17px] font-black text-[#282B42] uppercase tracking-tight font-heading">Campaign Settings</h2>
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 transition-all">
                            <X size={20} />
                        </button>
                    </div>
                    {/* Horizontal Tabs */}
                    <div className="flex gap-10">
                        <button className="pb-3 text-[13px] font-black text-[#5f49e0] border-b-2 border-[#5f49e0] uppercase tracking-widest">
                            Email Accounts
                        </button>
                    </div>
                </div>
                {tableContent}
            </div>
        </div>
    );
};

export default AccountModal;
