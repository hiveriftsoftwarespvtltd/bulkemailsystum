import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Filter, LayoutGrid, ChevronDown, ExternalLink, Plus, MoreHorizontal, 
    Calendar, Clock, Zap, Loader2, Target, MousePointer2, Pencil 
} from 'lucide-react';
import CreateCampaignModal from '../components/CreateCampaignModal';
import config from '../config';
import Swal from 'sweetalert2';

const Campaigns = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const campaignsPerPage = 8;

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${config.API_BASE_URL}/create-campaign`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            const result = await response.json();
            if (response.ok && result.data) {
                setCampaigns(result.data);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCampaign = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This campaign will be permanently deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'Yes, delete it!',
            borderRadius: '24px'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${config.API_BASE_URL}/create-campaign/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                    }
                });

                if (response.ok) {
                    if (localStorage.getItem('current_campaign_id') === id) {
                        localStorage.removeItem('current_campaign_id');
                        localStorage.removeItem('draft_campaign_name');
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Your campaign has been removed.',
                        timer: 2000,
                        showConfirmButton: false,
                        borderRadius: '24px'
                    });
                    fetchCampaigns();
                } else {
                    throw new Error('Failed to delete');
                }
            } catch (error) {
                Swal.fire('Error!', 'Could not delete correctly.', 'error');
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    return (
        <div className="h-full flex flex-col bg-white font-sans page-animate overflow-hidden">
            
            {/* --- TOP HEADER SECTION --- */}
            <div className="flex justify-between items-center px-8 py-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-8">
                    <div className="relative py-2 border-b-2 border-[#5f49e0] text-[#5f49e0] font-black text-[13px] uppercase tracking-widest cursor-pointer">
                        All Campaigns ({campaigns.length})
                    </div>
                    <div className="py-2 text-slate-400 font-bold text-[13px] hover:text-[#5f49e0] cursor-pointer transition-colors uppercase tracking-widest">
                        Folders
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative mr-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                        <input 
                           type="text" 
                           placeholder="Search Campaigns..." 
                           className="pl-9 pr-4 py-2 border border-slate-100 rounded-xl text-sm outline-none w-56 focus:border-[#5f49e0] placeholder:text-slate-300 bg-white" 
                        />
                    </div>
                    {/* <button className="flex items-center gap-2 px-4 py-2 border border-slate-100 rounded-xl text-slate-400 text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        <LayoutGrid size={14} className="text-[#5f49e0]" /> <span>Metrics</span> <ChevronDown size={14} />
                    </button> */}
                    <button 
                        onClick={() => {
                            // Clear all local draft states for a fresh start
                            const draftKeys = [
                                'current_campaign_id', 'draft_campaign_name', 'selected_sender_ids',
                                'draft_schedule', 'campaign_settings', 'draft_editor_data',
                                'draft_subject', 'draft_file_data', 'draft_csv_headers',
                                'draft_total_leads', 'draft_company_field', 'draft_owner_field',
                                'draft_email_field'
                            ];
                            draftKeys.forEach(key => localStorage.removeItem(key));
                            navigate('/campaigns/create');
                        }}
                        className="bg-[#5f49e0] text-white px-5 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-[#5f49e0]/90 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} strokeWidth={3} /> Create
                    </button>
                </div>
            </div>

            {/* --- TABLE CONTENT --- */}
            <div className="flex-1 overflow-auto bg-white">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#5f49e0] rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Syncing Dashboard...</p>
                    </div>
                ) : (
                    <table className="w-full border-collapse min-w-[1200px]">
                        <thead className="sticky top-0 z-20 bg-white shadow-sm border-b border-slate-100">
                            <tr className="text-slate-600 text-[11px] font-black uppercase tracking-widest">
                                <th className="px-8 py-5 text-left font-black">Campaign Details</th>
                                <th className="px-4 py-5 font-black text-center">Report</th>
                                <th className="px-4 py-5 font-black text-center">Open</th>
                                <th className="px-4 py-5 font-black text-center">Replied</th>
                                <th className="px-4 py-5 font-black text-center">Positive</th>
                                <th className="px-4 py-5 font-black text-center">Bounced</th>
                                <th className="px-8 py-5 text-right font-black uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                                {(() => {
                                    const indexOfLast = currentPage * campaignsPerPage;
                                    const indexOfFirst = indexOfLast - campaignsPerPage;
                                    const currentCampaigns = campaigns.slice(indexOfFirst, indexOfLast);
                                    const totalPages = Math.ceil(campaigns.length / campaignsPerPage);

                                    return (
                                        <>
                                            {currentCampaigns.map((camp) => (
                                    <tr key={camp._id} className="transition-all group h-[90px]">
                                        <td className="px-8 py-4 min-w-[350px]">
                                            <div className="flex items-center gap-5">
                                                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm transition-all group-hover:border-[#5f49e0]/20">
                                                   <span className={`text-[11px] font-black ${camp.status === 'DRAFT' ? 'text-slate-400 italic' : 'text-emerald-500'}`}>
                                                      {camp.status === 'DRAFT' ? '0%' : '100%'}
                                                   </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-[15px] font-black text-slate-900 tracking-tight leading-none group-hover:text-[#5f49e0] transition-colors">{camp.name || 'Untitled Campaign'}</h4>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none flex items-center gap-2 mt-1">
                                                        <span className={camp.status === 'DRAFT' ? 'text-slate-400' : 'text-emerald-500'}>{camp.status}</span> 
                                                        <span className="text-slate-200">|</span> 
                                                        Created: {formatDate(camp.createdAt)} 
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4"><div className="flex flex-col items-center"><span className="text-[17px] font-black text-slate-900">{camp.sent || 0}</span><span className="text-[9px] font-black text-slate-400 uppercase mt-1">Sent</span></div></td>
                                        <td className="px-4 py-4"><div className="flex flex-col items-center"><span className="text-[17px] font-black text-slate-900">{camp.opened || 0}</span><span className="text-[9px] font-black text-slate-400 uppercase mt-1">Opened</span></div></td>
                                        <td className="px-4 py-4"><div className="flex flex-col items-center"><span className="text-[17px] font-black text-slate-900">{camp.replied || 0}</span><span className="text-[9px] font-black text-slate-400 uppercase mt-1">Replied</span></div></td>
                                        <td className="px-4 py-4"><div className="flex flex-col items-center"><span className="text-[17px] font-black text-slate-900">{camp.positiveReply || 0}</span><span className="text-[9px] font-black text-slate-400 uppercase mt-1">Positive</span></div></td>
                                        <td className="px-4 py-4"><div className="flex flex-col items-center"><span className="text-[17px] font-black text-slate-900">{camp.bounced || 0}</span><span className="text-[9px] font-black text-slate-400 uppercase mt-1">Bounced</span></div></td>
                                                    <td className="px-8 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    localStorage.setItem('current_campaign_id', camp._id);
                                                                    navigate('/campaigns/config');
                                                                }}
                                                                className="p-3 hover:bg-slate-50 text-slate-400 hover:text-[#5f49e0] rounded-2xl transition-all border border-transparent hover:border-slate-100"
                                                                title="Edit"
                                                            >
                                                               <Pencil size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(camp._id); }}
                                                                className="p-3 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all border border-transparent hover:border-rose-100"
                                                                title="Delete"
                                                            >
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            
                                            {/* Pagination Logic Integrated */}
                                            {totalPages > 1 && (
                                                <tr className="bg-white">
                                                    <td colSpan="7" className="px-8 py-5 border-t border-slate-100">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    disabled={currentPage === 1}
                                                                    onClick={() => setCurrentPage(p => p - 1)}
                                                                    className="px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                                                                >
                                                                    Prev
                                                                </button>
                                                                <button 
                                                                    disabled={currentPage === totalPages}
                                                                    onClick={() => setCurrentPage(p => p + 1)}
                                                                    className="px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-50 disabled:opacity-30 transition-all"
                                                                >
                                                                    Next
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })()}
                        </tbody>
                    </table>
                )}
            </div>

            <CreateCampaignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default Campaigns;
